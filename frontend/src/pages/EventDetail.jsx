import { ArrowRight, Building2, CalendarDays, CalendarPlus, Check, Clock, MapPin, Minus, Navigation, Plus, Share2, Ticket } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { EventCard } from '@/components/events';
import { Glass, GlassTabs } from '@/components/glass';
import { Accordion, Badge, Button, ButtonLink, Countdown, EmptyState, SeatMeter, Skeleton } from '@/components/ui';
import { useEvent, useLocalBookings } from '@/hooks/data';
import { formatFullDate, formatPrice, formatTimeRange, imageSized, phaseOf, seatsLeft } from '@/lib/format';
import { addToCalendar, CategoryIcon, cn, FAQS } from '@/lib/misc';
import { MAX_SEATS } from '@/lib/validation';
import NotFound from './NotFound';

const TABS = ['Overview', 'Schedule', 'Venue', 'FAQ'];

function share(event) {
  const url = `${window.location.origin}/events/${event.slug}`;
  if (navigator.share) {
    navigator.share({ title: event.title, text: event.summary, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied'));
  }
}

function BookingCard({ event, booking }) {
  const navigate = useNavigate();
  const phase = phaseOf(event);
  const left = seatsLeft(event);
  const max = Math.max(1, Math.min(MAX_SEATS, left));
  const [seats, setSeats] = useState(1);

  return (
    <div className="surface p-6 shadow-[0_30px_60px_-40px_var(--glow)]">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-subtle">Price</p>
          <p className="display text-4xl">{formatPrice(event.price)}</p>
        </div>
        {event.price > 0 && <p className="pb-1 text-sm text-subtle">per seat</p>}
      </div>

      {phase === 'upcoming' && (
        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-wider text-subtle">Starts in</p>
          <Countdown target={event.startsAt} />
        </div>
      )}
      {phase !== 'ended' && <SeatMeter event={event} className="mt-6" />}

      {booking ? (
        <div className="mt-6 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-success">
            <Check className="size-4" /> You’re booked — {booking.seats} seat{booking.seats > 1 ? 's' : ''}
          </p>
          <ButtonLink to={`/bookings/${booking.reference}`} variant="inverse" size="md" className="mt-3 w-full">
            <Ticket className="size-4" /> View your pass
          </ButtonLink>
        </div>
      ) : phase === 'ended' ? (
        <p className="mt-6 rounded-xl bg-sunken p-4 text-center text-sm text-subtle">This event has ended.</p>
      ) : left === 0 ? (
        <p className="mt-6 rounded-xl bg-danger/10 p-4 text-center text-sm text-danger">Sold out — every seat is taken.</p>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between rounded-xl border border-line p-2 pl-4">
            <span className="text-sm">Seats</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setSeats((n) => Math.max(1, n - 1))} disabled={seats <= 1} aria-label="One fewer seat">
                <Minus className="size-4" />
              </Button>
              <span className="w-8 text-center font-mono font-semibold tabular-nums" aria-live="polite">
                {seats}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setSeats((n) => Math.min(max, n + 1))} disabled={seats >= max} aria-label="One more seat">
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-subtle">Total</span>
            <span className="font-semibold">{formatPrice(event.price * seats)}</span>
          </div>
          <Button size="lg" className="mt-4 w-full" onClick={() => navigate(`/checkout/${event.slug}?seats=${seats}`)}>
            Continue to booking <ArrowRight className="size-4" />
          </Button>
          <p className="mt-3 text-center text-xs text-subtle">No payment now · free cancellation</p>
        </>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2 border-t border-line pt-5">
        <Button variant="outline" size="sm" onClick={() => addToCalendar(event, booking?.reference)}>
          <CalendarPlus className="size-4" /> Calendar
        </Button>
        <Button variant="outline" size="sm" onClick={() => share(event)}>
          <Share2 className="size-4" /> Share
        </Button>
      </div>
    </div>
  );
}

function TabPanel({ tab, event }) {
  const d = 0.01;
  const map = `https://www.openstreetmap.org/export/embed.html?bbox=${event.venue.lng - d}%2C${event.venue.lat - d / 1.7}%2C${event.venue.lng + d}%2C${event.venue.lat + d / 1.7}&layer=mapnik&marker=${event.venue.lat}%2C${event.venue.lng}`;
  if (tab === 'Overview') {
    return (
      <div className="space-y-8">
        <p className="text-lg leading-relaxed text-text/85">{event.description}</p>
        <div>
          <h3 className="mb-4 font-semibold">Highlights</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {event.highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <Check className="size-3" />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map((t) => (
              <Link key={t} to={`/events?q=${encodeURIComponent(t)}`} className="rounded-lg border border-line px-2.5 py-1 text-xs text-subtle hover:border-line-strong hover:text-text">
                #{t}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (tab === 'Schedule') {
    return (
      <ol className="relative space-y-6 border-l border-line pl-8">
        {event.schedule.map((item) => (
          <li key={item.title} className="relative">
            <span className="absolute -left-[37px] top-1.5 size-2.5 rounded-full bg-lavender ring-4 ring-canvas" />
            <p className="font-mono text-sm text-accent">{item.time}</p>
            <p className="mt-0.5 font-medium">{item.title}</p>
          </li>
        ))}
      </ol>
    );
  }
  if (tab === 'Venue') {
    return (
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{event.venue.name}</p>
            <p className="text-sm text-subtle">{event.venue.city}, India</p>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${event.venue.lat},${event.venue.lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <Navigation className="size-4" /> Get directions
          </a>
        </div>
        <iframe title={`Map of ${event.venue.name}`} src={map} loading="lazy" className="mt-5 h-80 w-full rounded-2xl border border-line dark:[filter:invert(0.9)_hue-rotate(200deg)_saturate(0.6)]" />
      </div>
    );
  }
  return <Accordion items={FAQS.slice(0, 5)} />;
}

function DetailSkeleton() {
  return (
    <div className="shell py-12">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-6 h-14 w-2/3" />
      <Skeleton className="mt-10 aspect-[21/9] w-full rounded-3xl" />
    </div>
  );
}

export default function EventDetail() {
  const { slug } = useParams();
  const { data, isPending, isError, error } = useEvent(slug);
  const bookings = useLocalBookings();
  const [tab, setTab] = useState('Overview');
  useEffect(() => setTab('Overview'), [slug]);

  if (isPending) return <DetailSkeleton />;
  if (isError && error.status === 404) return <NotFound title="That event doesn’t exist" />;
  if (isError) return <div className="shell py-20"><EmptyState title="Couldn’t load this event">{error.message}</EmptyState></div>;

  const { event, similar } = data;
  const phase = phaseOf(event);
  const booking = bookings.find((b) => b.status === 'confirmed' && b.event?.id === event.id);

  return (
    <>
      <title>{`${event.title} · EventSphere`}</title>
      <meta name="description" content={event.summary} />
      <article>
        <header className="shell pt-10">
          <nav aria-label="Breadcrumb" className="text-sm text-subtle">
            <Link to="/" className="hover:text-text">Home</Link> /{' '}
            <Link to="/events" className="hover:text-text">Events</Link> /{' '}
            <Link to={`/events?category=${event.category}`} className="hover:text-text">{event.category}</Link>
          </nav>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge tone="accent"><CategoryIcon name={event.category} className="size-3.5" /> {event.category}</Badge>
            {event.featured && <Badge tone="solid">Featured</Badge>}
            {phase === 'live' && <Badge tone="danger">Happening now</Badge>}
            {phase === 'ended' && <Badge>Ended</Badge>}
          </div>
          <h1 className="display mt-4 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">{event.title}</h1>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-subtle">
            <div className="flex items-center gap-2"><CalendarDays className="size-4" /><dt className="sr-only">Date</dt><dd>{formatFullDate(event.startsAt)}</dd></div>
            <div className="flex items-center gap-2"><Clock className="size-4" /><dt className="sr-only">Time</dt><dd>{formatTimeRange(event.startsAt, event.endsAt)}</dd></div>
            <div className="flex items-center gap-2"><MapPin className="size-4" /><dt className="sr-only">Venue</dt><dd>{event.venue.name}, {event.venue.city}</dd></div>
            <div className="flex items-center gap-2"><Building2 className="size-4" /><dt className="sr-only">Organiser</dt><dd>by {event.organizer}</dd></div>
          </dl>
        </header>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="shell mt-10">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[28px] border border-line sm:aspect-[21/9]">
            <img src={imageSized(event.image, 1800)} alt={event.title} className={cn('size-full object-cover', phase === 'ended' && 'grayscale')} />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent" />
          </div>
        </motion.div>

        <div className="shell mt-12 grid gap-12 pb-28 lg:grid-cols-[1fr_380px] lg:pb-0">
          <div className="min-w-0">
            <GlassTabs
              label="Event information"
              layoutId="detail-tab"
              tabs={TABS.map((name) => ({ value: name, label: name }))}
              value={tab}
              onChange={setTab}
            />
            <AnimatePresence mode="wait">
              <motion.div key={tab} role="tabpanel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="pt-8">
                <TabPanel tab={tab} event={event} />
              </motion.div>
            </AnimatePresence>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Booking">
            <BookingCard event={event} booking={booking} />
          </aside>
        </div>
      </article>

      {similar.length > 0 && (
        <section className="shell mt-24" aria-labelledby="similar-heading">
          <h2 id="similar-heading" className="display text-4xl">You might also like</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
          </div>
        </section>
      )}

      {phase !== 'ended' && !booking && seatsLeft(event) > 0 && (
        <Glass
          radius={22}
          frost={0.7}
          className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 p-2 pl-4 lg:hidden"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{formatPrice(event.price)}</p>
            <p className="truncate text-xs text-subtle">{seatsLeft(event)} seats left</p>
          </div>
          <ButtonLink to={`/checkout/${event.slug}`}>Book seats</ButtonLink>
        </Glass>
      )}
    </>
  );
}
