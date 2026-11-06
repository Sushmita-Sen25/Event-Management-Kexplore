import { MapPin, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AgendaList } from '@/components/agenda';
import { AgendaSkeleton, EventCard, EventCardSkeleton } from '@/components/events';
import { GlassTabs } from '@/components/glass';
import { DriftShowcase } from '@/components/showcase';
import { ShineButton } from '@/components/specular';
import { Accordion, Countdown, Reveal, SectionHeading, SelectInput, TextLink } from '@/components/ui';
import { useEvents, useFacets } from '@/hooks/data';
import { formatMediumDate, formatNumber } from '@/lib/format';
import { CATEGORIES, FAQS } from '@/lib/misc';

const ease = [0.22, 1, 0.36, 1];

function SearchBar({ cities }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (city) params.set('city', city);
    navigate(`/events${params.size ? `?${params}` : ''}`);
  };
  return (
    <form role="search" onSubmit={submit} className="flex w-full flex-col gap-2 rounded-2xl border border-line-strong bg-raised p-1.5 sm:flex-row sm:items-center">
      <label className="flex flex-1 items-center gap-2.5 px-3">
        <Search className="size-4 shrink-0 text-subtle" aria-hidden />
        <span className="sr-only">Search events</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search events"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-subtle/80"
        />
      </label>
      <div className="flex items-center gap-1 border-t border-line pt-1.5 sm:w-44 sm:border-l sm:border-t-0 sm:pl-1.5 sm:pt-0">
        <MapPin className="ml-3 size-4 shrink-0 text-subtle sm:ml-2" aria-hidden />
        <label className="sr-only" htmlFor="hero-city">
          City
        </label>
        <SelectInput id="hero-city" value={city} onChange={(e) => setCity(e.target.value)} className="h-11 border-0 bg-transparent px-1.5 focus:ring-0">
          <option value="">Any city</option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </SelectInput>
      </div>
      <ShineButton type="submit" size="md" className="es-find">
        Find events
      </ShineButton>
    </form>
  );
}

function NextUp({ event }) {
  if (!event) return <div className="mt-8 h-[61px] border-t border-line" />;
  return (
    <Link to={`/events/${event.slug}`} className="group mt-8 grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-1 border-t border-line pt-5 text-sm sm:grid-cols-[auto_1fr_auto]">
      <span className="text-subtle">Next up</span>
      <span className="min-w-0 truncate font-medium group-hover:text-accent">
        {event.title}
        <span className="hidden font-normal text-subtle sm:inline">
          {' '}
          · {formatMediumDate(event.startsAt)}, {event.venue.city}
        </span>
      </span>
      <span className="col-start-2 text-subtle sm:col-start-auto">
        in <Countdown target={event.startsAt} compact className="text-text" />
      </span>
    </Link>
  );
}

function Hero({ facets, events, loading }) {
  const totals = facets?.totals;
  return (
    <section className="shell grid items-center gap-6 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-4 lg:pt-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} className="max-w-xl">
        <p className="text-sm text-subtle">
          {totals ? `${totals.events} upcoming events · ${totals.cities} cities · ${formatNumber(totals.seatsBooked)} seats booked` : 'Upcoming events across India'}
        </p>
        <h1 className="display mt-5 text-[clamp(3rem,6.4vw,5.4rem)]">
          The season,
          <br />
          <em className="italic text-accent">in one calendar.</em>
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-subtle">
          Concerts, conferences, workshops and festivals{totals ? ` in ${totals.cities} cities` : ' across India'}. Find something on, choose your seats and keep the
          pass on your phone.
        </p>
        <div className="mt-8">
          <SearchBar cities={facets?.cities ?? []} />
        </div>
        <NextUp event={events[0]} />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.2 }}>
        <DriftShowcase events={events} loading={loading} className="h-[320px] sm:h-[420px] lg:h-[580px]" />
      </motion.div>
    </section>
  );
}

function Featured({ events, loading }) {
  const [tab, setTab] = useState('All');
  const tabs = useMemo(() => ['All', ...CATEGORIES.map((c) => c.name).filter((n) => events.some((e) => e.category === n))], [events]);
  const shown = useMemo(() => {
    const list = tab === 'All' ? [...events].sort((a, b) => Number(b.featured) - Number(a.featured)) : events.filter((e) => e.category === tab);
    return list.slice(0, 6);
  }, [events, tab]);

  return (
    <section className="shell mt-20 lg:mt-24" aria-labelledby="featured-heading">
      <Reveal>
        <SectionHeading id="featured-heading" title="Featured this season" action={<TextLink to="/events">All events</TextLink>} />
      </Reveal>
      <GlassTabs label="Filter featured events" layoutId="featured-tab" className="mt-6" tabs={tabs.map((name) => ({ value: name, label: name }))} value={tab} onChange={setTab} />
      <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? Array.from({ length: 6 }, (_, i) => <EventCardSkeleton key={i} />) : shown.map((event, i) => <EventCard key={event.id} event={event} index={i} />)}
      </div>
    </section>
  );
}

function Calendar({ events, loading }) {
  const upcoming = useMemo(() => events.slice(0, 12), [events]);
  return (
    <section className="mt-28 border-y border-line bg-panel py-20" aria-labelledby="calendar-heading">
      <div className="shell grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
        <Reveal>
          <h2 id="calendar-heading" className="display text-[2.15rem] sm:text-[2.6rem]">
            What’s on, week by week
          </h2>
          <p className="mt-3 text-subtle">The next {upcoming.length || 'few'} events in date order. All times are IST.</p>
          <TextLink to="/events?view=list" className="mt-6">
            Full calendar
          </TextLink>
        </Reveal>
        <div className="min-w-0">{loading ? <AgendaSkeleton /> : <AgendaList events={upcoming} />}</div>
      </div>
    </section>
  );
}

function Categories({ facets }) {
  const counts = Object.fromEntries((facets?.categories ?? []).map((c) => [c.name, c.count]));
  return (
    <section className="shell mt-28" aria-labelledby="categories-heading">
      <Reveal>
        <SectionHeading id="categories-heading" title="Browse by category" action={<TextLink to="/events">All events</TextLink>} />
      </Reveal>
      <ul className="grid sm:grid-cols-2 sm:gap-x-12">
        {CATEGORIES.map(({ name, blurb }) => {
          const count = counts[name] ?? 0;
          return (
            <li key={name} className="border-b border-line">
              <Link to={`/events?category=${name}`} className="group flex items-end justify-between gap-6 py-6">
                <span>
                  <span className="display block text-[2rem] leading-none transition-colors group-hover:text-accent">{name}</span>
                  <span className="mt-2 block text-sm text-subtle">{blurb}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-subtle">
                  {count} {count === 1 ? 'event' : 'events'}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Faq() {
  return (
    <section className="shell mt-28 grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16" aria-labelledby="faq-heading">
      <Reveal>
        <h2 id="faq-heading" className="display text-[2.15rem] sm:text-[2.6rem]">
          Questions
        </h2>
        <p className="mt-3 text-subtle">Booking, passes and cancellations.</p>
      </Reveal>
      <Reveal delay={0.06}>
        <Accordion items={FAQS} />
      </Reveal>
    </section>
  );
}

export default function Home() {
  const { data: facets } = useFacets();
  const { data, isPending } = useEvents({ when: 'upcoming', limit: 24 });
  const events = data?.items ?? [];

  return (
    <>
      <title>EventSphere · Events across India</title>
      <Hero facets={facets} events={events} loading={isPending} />
      <Featured events={events} loading={isPending} />
      <Calendar events={events} loading={isPending} />
      <Categories facets={facets} />
      <Faq />
    </>
  );
}
