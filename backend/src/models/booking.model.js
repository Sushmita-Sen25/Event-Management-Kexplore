import mongoose from 'mongoose';
import { toClient } from './event.model.js';

export const MAX_SEATS_PER_BOOKING = 6;

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attendee: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
      city: String,
    },
    seats: { type: Number, min: 1, max: MAX_SEATS_PER_BOOKING, required: true },
    unitPrice: { type: Number, min: 0, required: true },
    total: { type: Number, min: 0, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    cancelledAt: Date,
  },
  { timestamps: true, toJSON: toClient },
);

// One active booking per email per event — the database enforces it, not just the form.
bookingSchema.index(
  { event: 1, 'attendee.email': 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' }, name: 'one_active_booking_per_email' },
);
bookingSchema.index({ user: 1, createdAt: -1 });

export const Booking = mongoose.model('Booking', bookingSchema);
