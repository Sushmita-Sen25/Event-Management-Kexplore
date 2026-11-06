import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { useLocalBookings } from '@/hooks/data';
import { dayNumber, formatMediumDate, formatPrice, formatTime, imageSized, monthShort, phaseOf, seatsLeft, weekdayShort } from '@/lib/format';
import { cn } from '@/lib/misc';
import { Skeleton } from './ui';

function useBooked(eventId) {
  const bookings = useLocalBookings();
  return bookings.some((b) => b.status === 'confirmed' && b.event?.id === eventId);
}

/** Only states a visitor needs to act on; "featured" is already implied by where a card appears. */
function statusOf(event, booked) {
  const phase = phaseOf(event);
  if (booked) return { label: 'Booked', icon: true };
  if (phase === 'ended') return { label: 'Ended' };
  if (phase === 'live') return { label: 'Happening now' };
  if (!seatsLeft(event)) return { label: 'Sold out' };
  return null;
}

export function EventCard({ event, index = 0 }) {
  const booked = useBooked(event.id);
  const ended = phaseOf(event) === 'ended';
  const status = statusOf(event, booked);
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex min-w-0 flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-sunken">
        <img
          src={imageSized(event.image, 760)}
          alt=""
          loading="lazy"
          className={cn('size-full object-cover transition duration-700 ease-[var(--ease-smooth)] group-hover:scale-[1.03]', ended && 'grayscale')}
        />
        {status && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-ink/75 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {status.icon && <Check className="size-3.5" aria-hidden />}
            {status.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[13px] text-subtle">
          <span className="font-medium text-accent">{event.category}</span>
          <span aria-hidden> · </span>
          {formatMediumDate(event.startsAt)}, {formatTime(event.startsAt)}
        </p>
        <h3 className="mt-1.5 text-[1.075rem] font-semibold leading-snug">
          {/* Stretched link: the whole card is clickable, the title is the accessible name. */}
          <Link to={`/events/${event.slug}`} className="after:absolute after:inset-0 group-hover:text-accent">
            {event.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-subtle">{event.summary}</p>
        <div className="mt-auto flex items-baseline justify-between gap-4 pt-4 text-sm">
          <span className="min-w-0 truncate text-subtle">
            {event.venue.name}, {event.venue.city}
          </span>
          <span className="shrink-0 font-medium tabular-nums">{formatPrice(event.price)}</span>
        </div>
      </div>
    </motion.article>
  );
}

export function EventCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/3] rounded-[14px]" />
      <div className="space-y-2.5 pt-4">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

/** One line of the event calendar: date · title · venue · time · price. */
export function AgendaRow({ event }) {
  const booked = useBooked(event.id);
  const status = statusOf(event, booked);
  return (
    <li>
      <Link
        to={`/events/${event.slug}`}
        className="group grid grid-cols-[52px_1fr_auto] items-center gap-4 py-5 md:grid-cols-[64px_1fr_220px_88px_72px] md:gap-6"
      >
        <span className="leading-none">
          <span className="display block text-[2.1rem]">{dayNumber(event.startsAt)}</span>
          <span className="mt-1 block text-[10.5px] tracking-wide text-subtle">
            {monthShort(event.startsAt)} · {weekdayShort(event.startsAt).toUpperCase()}
          </span>
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-[13px]">
            <span className="font-medium text-accent">{event.category}</span>
            {status && <span className="text-subtle">· {status.label}</span>}
          </span>
          <span className="mt-0.5 block truncate font-semibold group-hover:text-accent">{event.title}</span>
          <span className="mt-0.5 block truncate text-sm text-subtle md:hidden">
            {event.venue.city} · {formatTime(event.startsAt)}
          </span>
        </span>
        <span className="hidden truncate text-sm text-subtle md:block">
          {event.venue.name}, {event.venue.city}
        </span>
        <span className="hidden text-sm tabular-nums text-subtle md:block">{formatTime(event.startsAt)}</span>
        <span className="text-right text-sm font-medium tabular-nums">{formatPrice(event.price)}</span>
      </Link>
    </li>
  );
}

export function AgendaSkeleton({ rows = 5 }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-6 py-5">
          <Skeleton className="h-12 w-12" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
