/**
 * Bookings kept in Local Storage (bonus challenge: "Local Storage-based registration data management").
 *
 * Every booking is saved on the device so tickets open offline and without an account.
 * The server stays the source of truth: the Bookings page refreshes statuses through
 * POST /api/bookings/lookup, and signing in pulls in bookings made on other devices.
 * Components read the store with `useSyncExternalStore`; other tabs stay in sync via `storage` events.
 */
const KEY = 'eventsphere.bookings.v2';
const listeners = new Set();

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let snapshot = typeof window === 'undefined' ? [] : read();

function write(next) {
  snapshot = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private browsing / storage full — keep working from memory.
  }
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      snapshot = read();
      listeners.forEach((listener) => listener());
    }
  });
}

/** The parts of an event a saved booking needs to render on its own. */
const eventSummary = (event) =>
  event && typeof event === 'object'
    ? {
        id: event.id,
        slug: event.slug,
        title: event.title,
        category: event.category,
        image: event.image,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        venue: event.venue,
        price: event.price,
      }
    : null;

export function fromApi(booking, previous = {}) {
  return {
    reference: booking.reference,
    status: booking.status,
    seats: booking.seats,
    total: booking.total,
    attendee: booking.attendee ?? previous.attendee,
    event: eventSummary(booking.event) ?? previous.event,
    createdAt: booking.createdAt ?? previous.createdAt ?? new Date().toISOString(),
    cancelledAt: booking.cancelledAt ?? null,
    syncedAt: new Date().toISOString(),
  };
}

export const bookingsStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => snapshot,
  find: (reference) => snapshot.find((b) => b.reference === reference) ?? null,
  save(booking) {
    const rest = snapshot.filter((b) => b.reference !== booking.reference);
    write([booking, ...rest]);
  },
  /** Merge API results, keeping the device's unmasked attendee details. */
  merge(apiBookings) {
    const byRef = new Map(snapshot.map((b) => [b.reference, b]));
    for (const booking of apiBookings) {
      const previous = byRef.get(booking.reference) ?? {};
      const merged = fromApi(booking, previous);
      if (previous.attendee?.email && merged.attendee?.email?.includes('•')) merged.attendee = previous.attendee;
      byRef.set(booking.reference, merged);
    }
    write([...byRef.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  },
  remove: (reference) => write(snapshot.filter((b) => b.reference !== reference)),
  clear: () => write([]),
  activeFor: (eventId, email) =>
    snapshot.find(
      (b) => b.status === 'confirmed' && b.event?.id === eventId && (!email || b.attendee?.email === email.trim().toLowerCase()),
    ) ?? null,
};

export function toCsv(bookings) {
  const header = ['reference', 'event', 'date', 'venue', 'city', 'name', 'email', 'phone', 'seats', 'total', 'status', 'booked_at'];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = bookings.map((b) =>
    [b.reference, b.event?.title, b.event?.startsAt, b.event?.venue?.name, b.event?.venue?.city, b.attendee?.name, b.attendee?.email, b.attendee?.phone, b.seats, b.total, b.status, b.createdAt]
      .map(cell)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export function parseBackup(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : data?.bookings;
  if (!Array.isArray(list)) throw new Error('That file isn’t an EventSphere bookings backup');
  return list.filter((b) => /^ES-[A-Z0-9]{6}$/.test(b?.reference) && b?.event?.title);
}

export function download(filename, contents, type) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
