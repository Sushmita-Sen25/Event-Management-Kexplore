import { ArrowUpRight, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router';
import AnimatedList from '@/components/AnimatedList';
import { useLocalBookings } from '@/hooks/data';
import { useTheme } from '@/hooks/theme';
import { dayNumber, formatPrice, formatTime, monthShort, relativeDay, seatsLeft, weekdayShort } from '@/lib/format';
import { CategoryIcon, cn } from '@/lib/misc';

/*
 * React Bits <AnimatedList> skinned with the EventSphere palette.
 * The list's own theme variables are inline styles, so ours go in through `style`.
 */
const SKINS = {
  dark: {
    '--al-frame': 'rgb(34 25 50 / 0.55)',
    '--al-frame-edge': 'rgb(150 130 185 / 0.16)',
    '--al-frame-highlight': 'rgb(255 255 255 / 0.05)',
    '--al-frame-shadow': 'none',
    '--al-tile': 'linear-gradient(180deg, #251b35 0%, #1a1222 100%)',
    '--al-tile-edge': 'rgb(150 130 185 / 0.12)',
    '--al-tile-highlight': 'rgb(255 255 255 / 0.06)',
    '--al-tile-shadow': '0 6px 14px -8px rgb(0 0 0 / 0.8)',
    '--al-well': 'rgb(150 130 185 / 0.12)',
    '--al-ink': '#f4ecf6',
    '--al-muted': '#a798b8',
    '--al-thumb': 'rgb(150 130 185 / 0.32)',
    '--al-hover': 'brightness(1.14)',
    '--al-press': 'brightness(0.9)',
    '--al-active': 'brightness(1.18)',
  },
  light: {
    '--al-frame': 'rgb(255 255 255 / 0.6)',
    '--al-frame-edge': 'rgb(34 25 50 / 0.08)',
    '--al-frame-highlight': '#ffffff',
    '--al-frame-shadow': 'none',
    '--al-tile': 'linear-gradient(180deg, #ffffff 0%, #faf6fb 100%)',
    '--al-tile-edge': 'rgb(34 25 50 / 0.08)',
    '--al-tile-highlight': '#ffffff',
    '--al-tile-shadow': '0 6px 14px -10px rgb(84 21 51 / 0.35)',
    '--al-well': 'rgb(114 37 72 / 0.07)',
    '--al-ink': '#221932',
    '--al-muted': '#66577a',
    '--al-thumb': 'rgb(34 25 50 / 0.2)',
    '--al-hover': 'brightness(0.98)',
    '--al-press': 'brightness(0.94)',
    '--al-active': 'none',
  },
};

function AgendaItem({ event, booked, selected }) {
  const left = seatsLeft(event);
  return (
    <span className="grid w-full min-w-0 grid-cols-[56px_1fr_auto] items-center gap-3 md:grid-cols-[64px_1fr_96px_auto] md:gap-5">
      <span className="grid h-16 place-items-center rounded-xl bg-[var(--al-well)] text-center leading-none">
        <span>
          <span className="display block text-3xl">{dayNumber(event.startsAt)}</span>
          <span className="mt-1 block text-[10px] tracking-wide text-[var(--al-muted)]">
            {monthShort(event.startsAt)} · {weekdayShort(event.startsAt).toUpperCase()}
          </span>
        </span>
      </span>

      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-accent">
            <CategoryIcon name={event.category} className="size-3.5" aria-hidden /> {event.category}
          </span>
          <span className="text-[var(--al-muted)]">· {relativeDay(event.startsAt)}</span>
          {booked && <span className="rounded-full bg-success/15 px-2 py-0.5 font-medium text-success">Booked</span>}
          {!left && <span className="rounded-full bg-danger/15 px-2 py-0.5 font-medium text-danger">Sold out</span>}
        </span>
        <span className="mt-1 block truncate text-[15px] font-semibold">{event.title}</span>
        <span className="mt-0.5 block truncate text-sm text-[var(--al-muted)]">
          <MapPin className="mr-1 inline size-3.5 -translate-y-px" aria-hidden />
          <span className="md:hidden">
            {event.venue.city} · {formatTime(event.startsAt)}
          </span>
          <span className="hidden md:inline">
            {event.venue.name}, {event.venue.city}
          </span>
        </span>
      </span>

      <span className="hidden text-sm text-[var(--al-muted)] md:block">
        <Clock className="mr-1.5 inline size-4 -translate-y-px" aria-hidden />
        {formatTime(event.startsAt)}
      </span>

      <span className="flex items-center gap-3">
        <span className="text-sm font-semibold">{formatPrice(event.price)}</span>
        <span
          className={cn(
            'grid size-9 place-items-center rounded-full border border-[var(--al-tile-edge)] transition-colors duration-200',
            selected && 'border-lavender bg-plum text-white',
          )}
          aria-hidden
        >
          <ArrowUpRight className="size-4" />
        </span>
      </span>
    </span>
  );
}

/** Upcoming events as a keyboard- and hover-navigable animated list; Enter or click opens the event. */
export function AgendaList({ events, maxHeight = 560 }) {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const bookings = useLocalBookings();
  const bookedIds = new Set(bookings.filter((b) => b.status === 'confirmed').map((b) => b.event?.id));

  return (
    // Lenis would otherwise swallow wheel events meant for the list's own scroller.
    <div data-lenis-prevent className="min-w-0">
      <AnimatedList
        items={events}
        theme={dark ? 'dark' : 'light'}
        accentColor={dark ? '#9682B9' : '#722548'}
        width="100%"
        maxHeight={maxHeight}
        radius={14}
        gap={6}
        fadeSize={64}
        stagger={0.04}
        className="es-agenda"
        itemClassName="es-agenda__item"
        style={SKINS[dark ? 'dark' : 'light']}
        onItemSelect={(event) => navigate(`/events/${event.slug}`)}
        renderItem={(event, _index, selected) => (
          <AgendaItem event={event} booked={bookedIds.has(event.id)} selected={selected} />
        )}
      />
    </div>
  );
}
