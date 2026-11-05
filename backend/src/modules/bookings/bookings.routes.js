import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { ApiError, objectId, parse } from '../../lib/http.js';
import { bookingReference } from '../../lib/reference.js';
import { signedIn } from '../../lib/session.js';
import { Booking, MAX_SEATS_PER_BOOKING } from '../../models/booking.model.js';
import { Event } from '../../models/event.model.js';
import { CARD } from '../events/events.routes.js';

// Indian mobile numbers: optional +91 / 0 prefix, then 10 digits starting 6–9.
const INDIAN_MOBILE = /^(?:\+91|0)?[6-9]\d{9}$/;

const createBooking = z.object({
  eventId: objectId,
  name: z
    .string()
    .trim()
    .min(3, 'Enter your full name')
    .max(60, 'Name is too long')
    .regex(/^[\p{L}][\p{L}\p{M}\s.'-]+$/u, 'Use letters only'), // \p{M}: vowel signs in Indian scripts
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s()-]/g, ''))
    .refine((v) => INDIAN_MOBILE.test(v), 'Enter a valid 10-digit Indian mobile number'),
  city: z.string().trim().max(60).optional().or(z.literal('')),
  seats: z.coerce
    .number()
    .int()
    .min(1, 'Choose at least one seat')
    .max(MAX_SEATS_PER_BOOKING, `You can book up to ${MAX_SEATS_PER_BOOKING} seats at a time`),
});

const lookup = z.object({ references: z.array(z.string().regex(/^ES-[A-Z0-9]{6}$/)).max(100) });
const cancel = z.object({ email: z.string().trim().toLowerCase().optional() });

const ownedBy = (user, booking) =>
  Boolean(user && (String(booking.user) === String(user._id) || booking.attendee.email === user.email));

const hide = (value, keep) => value.slice(0, keep) + '•'.repeat(Math.max(3, value.length - keep - 3)) + value.slice(-3);

export const bookingsRouter = Router();

bookingsRouter.post(
  '/',
  rateLimit({ windowMs: 10 * 60_000, limit: 25, standardHeaders: 'draft-8', legacyHeaders: false, validate: false }),
  parse(createBooking),
  async (req, res) => {
    const { eventId, seats, ...attendee } = req.data.body;
    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, 'This event is no longer available');
    if (event.endsAt < new Date()) throw new ApiError(410, 'Bookings have closed — this event has ended');

    if (await Booking.exists({ event: event._id, 'attendee.email': attendee.email, status: 'confirmed' })) {
      throw new ApiError(409, 'You already have a booking for this event', {
        email: 'This email already holds a booking for this event',
      });
    }

    // Reserve seats atomically: the update only matches while enough seats remain.
    const reserved = await Event.findOneAndUpdate(
      { _id: event._id, $expr: { $lte: [{ $add: ['$booked', seats] }, '$capacity'] } },
      { $inc: { booked: seats } },
      { returnDocument: 'after' },
    );
    if (!reserved) {
      const left = Math.max(0, event.capacity - event.booked);
      throw new ApiError(409, left ? `Only ${left} seat${left === 1 ? '' : 's'} left` : 'This event is sold out', left ? { seats: `Only ${left} left` } : undefined);
    }

    try {
      const booking = await Booking.create({
        reference: bookingReference(),
        event: event._id,
        user: req.user?._id,
        attendee,
        seats,
        unitPrice: event.price,
        total: event.price * seats,
      });
      await booking.populate('event', CARD);
      res.status(201).json({ booking });
    } catch (err) {
      await Event.updateOne({ _id: event._id }, { $inc: { booked: -seats } }); // release the reservation
      if (err?.code === 11000) {
        throw new ApiError(409, 'You already have a booking for this event', { email: 'This email already holds a booking for this event' });
      }
      throw err;
    }
  },
);

bookingsRouter.get('/mine', signedIn, async (req, res) => {
  const items = await Booking.find({ $or: [{ user: req.user._id }, { 'attendee.email': req.user.email }] })
    .sort({ createdAt: -1 })
    .populate('event', CARD);
  res.json({ items });
});

/** Lets the browser reconcile bookings it keeps in Local Storage. */
bookingsRouter.post('/lookup', parse(lookup), async (req, res) => {
  const items = await Booking.find({ reference: { $in: req.data.body.references } })
    .select('reference status seats total cancelledAt event')
    .populate('event', CARD);
  res.json({ items });
});

bookingsRouter.get('/:reference', async (req, res) => {
  const booking = await Booking.findOne({ reference: req.params.reference.toUpperCase() }).populate('event', CARD);
  if (!booking) throw new ApiError(404, 'No booking with that reference');
  const json = booking.toJSON();
  if (!ownedBy(req.user, booking)) {
    json.attendee.email = hide(json.attendee.email, 2);
    json.attendee.phone = hide(json.attendee.phone, 3);
  }
  res.json({ booking: json });
});

bookingsRouter.post('/:reference/cancel', parse(cancel), async (req, res) => {
  const booking = await Booking.findOne({ reference: req.params.reference.toUpperCase() });
  if (!booking) throw new ApiError(404, 'No booking with that reference');
  if (!ownedBy(req.user, booking) && booking.attendee.email !== req.data.body.email) {
    throw new ApiError(403, 'Only the person who booked can cancel');
  }
  if (booking.status === 'confirmed') {
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();
    await Event.updateOne({ _id: booking.event, booked: { $gte: booking.seats } }, { $inc: { booked: -booking.seats } });
  }
  await booking.populate('event', CARD);
  res.json({ booking });
});
