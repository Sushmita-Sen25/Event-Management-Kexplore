/**
 * Seed the catalogue.
 *   npm run seed        upsert events by slug (live seat counts are preserved)
 *   npm run seed:fresh  delete events and bookings, then insert everything again
 */
import mongoose from 'mongoose';
import { connectDatabase } from '../db.js';
import { toSlug } from '../lib/reference.js';
import { Booking } from '../models/booking.model.js';
import { Event } from '../models/event.model.js';
import { Subscriber } from '../models/subscriber.model.js';
import { User } from '../models/user.model.js';
import { newEvents } from './new-events.js';
import { originalEvents } from './original-events.js';

const HOURS = { Music: 6, Technology: 8, Workshop: 6, Sports: 5, Food: 5, Art: 6, Business: 7 };

// Running order per category: [minutes after start, item].
const SCHEDULE = {
  Music: [[0, 'Gates open'], [60, 'Opening sets'], [180, 'Headline performance'], [330, 'Closing set']],
  Technology: [[0, 'Check-in and breakfast'], [60, 'Opening keynote'], [150, 'Breakout sessions'], [360, 'Networking and demos']],
  Workshop: [[0, 'Welcome and setup'], [30, 'Hands-on session one'], [180, 'Lunch break'], [240, 'Session two and showcase']],
  Sports: [[0, 'Bib collection and warm-up'], [45, 'Flag-off'], [240, 'Finish line, medals and breakfast']],
  Food: [[0, 'Stalls open'], [90, 'Live cooking demo'], [180, 'Music and desserts']],
  Art: [[0, 'Doors open'], [60, 'Curator walk-through'], [180, 'Artist talk'], [300, 'Closing reception']],
  Business: [[0, 'Registration and coffee'], [45, 'Keynote'], [150, 'Panel discussion'], [300, 'Networking']],
};

const ist = (local) => new Date(`${local}:00+05:30`);
const clock = (date) =>
  new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).format(date);

// Events that start in the evening are capped at 3.5 hours unless they set `hours` explicitly.
function durationHours(raw, startsAt) {
  if (raw.hours) return raw.hours;
  const startHour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(startsAt));
  return startHour >= 17 ? Math.min(HOURS[raw.category], 3.5) : HOURS[raw.category];
}

function toDocument(raw) {
  const startsAt = ist(raw.date);
  const hours = durationHours(raw, startsAt);
  // Stretch or squeeze the category's running order to fit this event's length.
  const scale = hours / HOURS[raw.category];
  const { date: _date, hours: _hours, ...rest } = raw;
  return {
    ...rest,
    slug: toSlug(raw.title),
    summary: raw.description.split(/(?<=[.!?])\s/)[0],
    startsAt,
    endsAt: new Date(startsAt.getTime() + hours * 3_600_000),
    schedule: SCHEDULE[raw.category].map(([minutes, title]) => ({
      time: clock(new Date(startsAt.getTime() + Math.round((minutes * scale) / 15) * 15 * 60_000)),
      title,
    })),
  };
}

await connectDatabase();

if (process.argv.includes('--fresh')) {
  await Promise.all([Event.deleteMany({}), Booking.deleteMany({})]);
  console.log('[seed] cleared events and bookings');
}

let inserted = 0;
for (const raw of [...originalEvents, ...newEvents]) {
  const doc = toDocument(raw);
  const existing = await Event.findOne({ slug: doc.slug });
  if (existing) {
    const { booked: _keepLiveCount, ...updates } = doc;
    await existing.set(updates).save();
  } else {
    await Event.create(doc);
    inserted += 1;
  }
}

await Promise.all([Event.syncIndexes(), Booking.syncIndexes(), User.syncIndexes(), Subscriber.syncIndexes()]);
console.log(`[seed] ${inserted} inserted, ${(await Event.countDocuments()) - inserted} updated`);
await mongoose.disconnect();
