import { ArrowRight, ArrowUpRight, CalendarDays, Clock, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { useLocalBookings } from '@/hooks/data';
import { dayNumber, formatMediumDate, formatPrice, formatTime, imageSized, monthShort, phaseOf, seatsLeft, weekdayShort } from '@/lib/format';
import { CategoryIcon, cn } from '@/lib/misc';
import { Badge, ButtonLink, Skeleton } from './ui';

function useBooked(eventId) {
  const bookings = useLocalBookings();
  return bookings.some((b) => b.status === 'confirmed' && b.event?.id === eventId);
}

function StatusBadge({ event, booked }) {
  const phase = phaseOf(event);
  if (booked) return <Badge tone="success">Booked</Badge>;
  if (phase === 'ended') return <Badge>Ended</Badge>;
  if (phase === 'live') return <Badge tone="danger">Happening now</Badge>;
  if (!seatsLeft(event)) return <Badge tone="danger">Sold out</Badge>;
  if (event.featured) return <Badge tone="solid">Featured</Badge>;
  return null;
}

export function EventCard({ event, index = 0 }) {
  const booked = useBooked(event.id);
  const ended = phaseOf(event) === 'ended';
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group surface flex flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_24px_50px_-28px_var(--glow)]"
    >
      <Link to={`/events/${event.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-sunken" tabIndex={-1} aria-hidden>
        <img
          src={imageSized(event.image, 760)}
          alt=""
          loading="lazy"
          className={cn('size-full object-cover transition duration-700 ease-[var(--ease-smooth)] group-hover:scale-[1.04]', ended && 'grayscale')}
        />
        <div className="glass absolute left-3 top-3 rounded-lg px-2.5 py-1.5 text-center leading-none">
          <span className="display block text-2xl">{dayNumber(event.startsAt)}</span>
          <span className="font-mono text-[10px] tracking-[0.16em] text-subtle">{monthShort(event.startsAt)}</span>
        </div>
        <div className="absolute right-3 top-3">
          <StatusBadge event={event} booked={booked} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-xs text-subtle">
          <CategoryIcon name={event.category} className="size-3.5 text-accent" aria-hidden />
          {event.category}
          <span aria-hidden>·</span>
          {event.venue.city}
        </p>
        <h3 className="mt-2 text-lg font-semibold leading-snug">
          <Link to={`/events/${event.slug}`} className="hover:text-accent">
            {event.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-subtle">{event.summary}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-subtle">
          <li className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            {formatMediumDate(event.startsAt)} · {formatTime(event.startsAt)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{event.venue.name}</span>
          </li>
        </ul>
        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-line pt-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-subtle">{event.price ? 'From' : 'Entry'}</p>
              <p className="font-semibold">{formatPrice(event.price)}</p>
            </div>
            {ended ? (
              <ButtonLink to={`/events/${event.slug}`} variant="ghost" size="sm">
                Details
              </ButtonLink>
            ) : (
              <ButtonLink to={booked ? '/bookings' : `/events/${event.slug}`} variant={booked ? 'ghost' : 'outline'} size="sm" className="group/btn">
                {booked ? 'View booking' : 'Book seats'}
                <ArrowRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5" />
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

/** One line of the event calendar: date · title · venue · time · price. */
export function AgendaRow({ event }) {
  const booked = useBooked(event.id);
  return (
    <li>
      <Link
        to={`/events/${event.slug}`}
        className="group grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-2xl px-3 py-4 transition hover:bg-accent-soft md:grid-cols-[84px_1fr_220px_130px_40px] md:gap-6 md:px-4"
      >
        <div className="text-center leading-none">
          <span className="display block text-4xl">{dayNumber(event.startsAt)}</span>
          <span className="mt-1 block font-mono text-[10px] tracking-[0.16em] text-subtle">
            {monthShort(event.startsAt)} · {weekdayShort(event.startsAt).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-accent">
              <CategoryIcon name={event.category} className="size-3.5" aria-hidden /> {event.category}
            </span>
            {booked && <Badge tone="success">Booked</Badge>}
            {!seatsLeft(event) && <Badge tone="danger">Sold out</Badge>}
          </div>
          <p className="mt-1 truncate font-semibold group-hover:text-accent">{event.title}</p>
          <p className="mt-0.5 truncate text-sm text-subtle md:hidden">
            {event.venue.city} · {formatTime(event.startsAt)}
          </p>
        </div>
        <p className="hidden truncate text-sm text-subtle md:block">
          <MapPin className="mr-1.5 inline size-4 -translate-y-px" aria-hidden />
          {event.venue.name}, {event.venue.city}
        </p>
        <p className="hidden text-sm text-subtle md:block">
          <Clock className="mr-1.5 inline size-4 -translate-y-px" aria-hidden />
          {formatTime(event.startsAt)}
        </p>
        <span className="flex items-center gap-3">
          <span className="text-sm font-semibold md:hidden">{formatPrice(event.price)}</span>
          <span className="grid size-10 place-items-center rounded-full border border-line transition group-hover:border-lavender group-hover:bg-cta group-hover:text-white">
            <ArrowUpRight className="size-4" />
          </span>
        </span>
      </Link>
    </li>
  );
}

export function AgendaSkeleton({ rows = 5 }) {
  return (
    <ul className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-6 px-4 py-5">
          <Skeleton className="h-12 w-14" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
