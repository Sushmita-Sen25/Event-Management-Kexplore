// Every event is in India, so dates and times are always shown in IST.
const zone = { timeZone: 'Asia/Kolkata' };
const make = (options) => new Intl.DateTimeFormat('en-IN', { ...zone, ...options });

const fullDate = make({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const mediumDate = make({ weekday: 'short', day: 'numeric', month: 'short' });
const shortDate = make({ day: 'numeric', month: 'short', year: 'numeric' });
const timeOnly = make({ hour: 'numeric', minute: '2-digit', hour12: true });
const day = make({ day: '2-digit' });
const month = make({ month: 'short' });
const weekday = make({ weekday: 'short' });
const monthYear = make({ month: 'long', year: 'numeric' });

const asDate = (value) => (value instanceof Date ? value : new Date(value));

export const formatFullDate = (d) => fullDate.format(asDate(d));
export const formatMediumDate = (d) => mediumDate.format(asDate(d));
export const formatShortDate = (d) => shortDate.format(asDate(d));
export const formatTime = (d) => timeOnly.format(asDate(d)).toUpperCase();
export const dayNumber = (d) => day.format(asDate(d));
export const monthShort = (d) => month.format(asDate(d)).toUpperCase();
export const weekdayShort = (d) => weekday.format(asDate(d));
export const monthLabel = (d) => monthYear.format(asDate(d));

export const formatTimeRange = (start, end) => `${formatTime(start)} – ${formatTime(end)} IST`;

export const formatPrice = (amount) =>
  amount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount) : 'Free';

export const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(n ?? 0);

/** "upcoming" | "live" | "ended" */
export function phaseOf(event, now = Date.now()) {
  if (now > asDate(event.endsAt).getTime()) return 'ended';
  if (now >= asDate(event.startsAt).getTime()) return 'live';
  return 'upcoming';
}

export const seatsLeft = (event) => Math.max(0, (event.capacity ?? 0) - (event.booked ?? 0));

export function demandLabel(event) {
  const left = seatsLeft(event);
  const share = event.capacity ? event.booked / event.capacity : 0;
  if (!left) return { label: 'Sold out', tone: 'danger', share: 1 };
  if (share >= 0.85) return { label: `${left} seats left`, tone: 'warning', share };
  return { label: `${formatNumber(left)} seats available`, tone: 'neutral', share };
}

/** Narrower Unsplash rendition for thumbnails and cards. */
export const imageSized = (url, width) => (url?.includes('images.unsplash.com') ? url.replace(/([?&])w=\d+/, `$1w=${width}`) : url);

// Whole IST calendar days between now and the event, for "Tomorrow" / "In 5 days" chips.
const isoDay = new Intl.DateTimeFormat('en-CA', { ...zone, year: 'numeric', month: '2-digit', day: '2-digit' });
const dayIndex = (d) => Date.parse(isoDay.format(asDate(d))) / 86_400_000;
export function relativeDay(d, now = Date.now()) {
  const diff = Math.round(dayIndex(d) - dayIndex(now));
  if (diff < 0) return 'Under way';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return `In ${diff} days`;
  const weeks = Math.round(diff / 7);
  return weeks === 1 ? 'Next week' : `In ${weeks} weeks`;
}
