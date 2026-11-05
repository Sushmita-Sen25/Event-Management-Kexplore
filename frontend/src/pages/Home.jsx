import { ArrowRight, CalendarSearch, MapPin, Search, ShieldCheck, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AgendaRow, AgendaSkeleton, EventCard, EventCardSkeleton } from '@/components/events';
import { DriftShowcase } from '@/components/showcase';
import { Accordion, Button, ButtonLink, Reveal, SectionHeading, SelectInput } from '@/components/ui';
import { useEvents, useFacets } from '@/hooks/data';
import { formatNumber, monthLabel } from '@/lib/format';
import { CATEGORIES, cn, FAQS } from '@/lib/misc';

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
    <form
      role="search"
      onSubmit={submit}
      className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-line bg-raised p-2 shadow-[0_30px_60px_-30px_var(--glow)] sm:flex-row sm:items-center"
    >
      <label className="flex flex-1 items-center gap-2.5 px-3">
        <Search className="size-4 shrink-0 text-subtle" aria-hidden />
        <span className="sr-only">Search events</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search events, venues or organisers"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-subtle/80"
        />
      </label>
      <div className="flex items-center gap-2 border-t border-line pt-2 sm:w-48 sm:border-l sm:border-t-0 sm:pl-2 sm:pt-0">
        <MapPin className="ml-3 size-4 shrink-0 text-subtle sm:ml-1" aria-hidden />
        <label className="sr-only" htmlFor="hero-city">
          City
        </label>
        <SelectInput id="hero-city" value={city} onChange={(e) => setCity(e.target.value)} className="h-11 border-0 bg-transparent px-1 focus:ring-0">
          <option value="">Any city</option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </SelectInput>
      </div>
      <Button type="submit" size="lg">
        Find events
      </Button>
    </form>
  );
}

function Hero({ facets }) {
  const totals = facets?.totals;
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="glow-field absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-lavender/40 to-transparent" />
      <div className="shell pb-12 pt-14 text-center sm:pt-20">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <Link to="/events" className="inline-flex items-center gap-2 rounded-full border border-line bg-raised/60 px-3.5 py-1.5 text-xs text-subtle transition hover:border-line-strong hover:text-text">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            {totals ? `${totals.events} upcoming events in ${totals.cities} cities` : 'Upcoming events across India'}
            <ArrowRight className="size-3" />
          </Link>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.05, ease }}
          className="display mx-auto mt-7 max-w-4xl text-[clamp(3rem,8vw,6.4rem)]"
        >
          Find the moments <em className="bg-gradient-to-r from-lavender via-accent to-dusk bg-clip-text italic text-transparent">worth showing up for.</em>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease }}
          className="mx-auto mt-6 max-w-xl text-lg text-subtle"
        >
          Concerts, conferences, workshops and festivals across India — handpicked, honestly priced and bookable in under a minute.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25, ease }} className="mt-9">
          <SearchBar cities={facets?.cities ?? []} />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-subtle">
          Popular:
          {[
            ['This week', '/events?when=week'],
            ['Free entry', '/events?price=free'],
            ['Music', '/events?category=Music'],
            ['Technology', '/events?category=Technology'],
          ].map(([label, to]) => (
            <Link key={label} to={to} className="rounded-lg border border-line px-2.5 py-1 text-xs transition hover:border-line-strong hover:text-text">
              {label}
            </Link>
          ))}
        </motion.p>
      </div>
    </section>
  );
}

function Stats({ facets }) {
  const items = [
    [facets?.totals.events ?? '—', 'upcoming events'],
    [facets?.totals.cities ?? '—', 'cities across India'],
    [facets ? formatNumber(facets.totals.seatsBooked) : '—', 'seats booked this season'],
    ['4.8/5', 'average attendee rating'],
  ];
  return (
    <section aria-label="EventSphere in numbers" className="shell mt-16">
      <dl className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
        {items.map(([value, label], i) => (
          <div key={label} className={cn('px-4 py-8 sm:px-8', i % 2 === 1 && 'border-l border-line', i >= 2 && 'border-t border-line lg:border-t-0', i === 2 && 'lg:border-l')}>
            <dt className="sr-only">{label}</dt>
            <dd>
              <span className="display block text-5xl">{value}</span>
              <span className="mt-1 block text-sm text-subtle">{label}</span>
            </dd>
          </div>
        ))}
      </dl>
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
    <section className="shell mt-24" aria-labelledby="featured-heading">
      <Reveal>
        <SectionHeading
          eyebrow="Featured"
          title={<span id="featured-heading">Handpicked for this season</span>}
          description="The events our community is booking fastest — from stadium festivals to forty-seat masterclasses."
          action={
            <ButtonLink to="/events" variant="outline">
              View all events <ArrowRight className="size-4" />
            </ButtonLink>
          }
        />
      </Reveal>
      <div role="tablist" aria-label="Filter featured events" className="no-scrollbar mt-8 flex gap-1 overflow-x-auto rounded-xl border border-line bg-panel p-1 sm:inline-flex">
        {tabs.map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className="relative shrink-0 rounded-lg px-4 py-2 text-sm font-medium"
          >
            {tab === name && <motion.span layoutId="featured-tab" className="absolute inset-0 rounded-lg bg-raised shadow-sm ring-1 ring-line" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className={cn('relative', tab === name ? 'text-text' : 'text-subtle')}>{name}</span>
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? Array.from({ length: 6 }, (_, i) => <EventCardSkeleton key={i} />) : shown.map((event, i) => <EventCard key={event.id} event={event} index={i} />)}
      </div>
    </section>
  );
}

function Calendar({ events, loading }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const event of events.slice(0, 8)) {
      const label = monthLabel(event.startsAt);
      map.set(label, [...(map.get(label) ?? []), event]);
    }
    return [...map.entries()];
  }, [events]);

  return (
    <section className="mt-28 border-y border-line bg-panel py-20" aria-labelledby="calendar-heading">
      <div className="shell grid gap-12 lg:grid-cols-[320px_1fr]">
        <Reveal>
          <p className="eyebrow">The calendar</p>
          <h2 id="calendar-heading" className="display mt-3 text-4xl sm:text-5xl">
            What’s on, week by week.
          </h2>
          <p className="mt-4 text-subtle">Every upcoming event in date order, with times in IST. Tap any row for the full details and seat availability.</p>
          <ButtonLink to="/events?view=list" variant="outline" className="mt-6">
            <CalendarSearch className="size-4" /> Open full calendar
          </ButtonLink>
        </Reveal>
        <div>
          {loading ? (
            <AgendaSkeleton />
          ) : (
            groups.map(([label, list]) => (
              <div key={label} className="mb-6 last:mb-0">
                <p className="mb-1 flex items-center gap-3 px-3 font-mono text-xs uppercase tracking-[0.16em] text-subtle md:px-4">
                  {label}
                  <span className="h-px flex-1 bg-line" />
                </p>
                <ul>
                  {list.map((event) => (
                    <AgendaRow key={event.id} event={event} />
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function Categories({ facets }) {
  const counts = Object.fromEntries((facets?.categories ?? []).map((c) => [c.name, c.count]));
  return (
    <section className="shell mt-28" aria-labelledby="categories-heading">
      <Reveal>
        <SectionHeading eyebrow="Browse" title={<span id="categories-heading">Start with what you love</span>} />
      </Reveal>
      <div className="mt-10 grid gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map(({ name, icon: Icon, blurb }) => (
          <Link key={name} to={`/events?category=${name}`} className="group flex flex-col gap-6 bg-raised p-6 transition hover:bg-panel">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-cta group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <span className="font-mono text-xs text-subtle">{counts[name] ?? 0} events</span>
            </div>
            <div>
              <h3 className="flex items-center gap-2 font-semibold">
                {name}
                <ArrowRight className="size-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
              </h3>
              <p className="mt-1 text-sm text-subtle">{blurb}</p>
            </div>
          </Link>
        ))}
        <Link to="/events" className="group flex flex-col justify-between gap-6 bg-gradient-to-br from-wine via-plum to-dusk p-6 text-white">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-white/70">All categories</span>
          <h3 className="display flex items-center gap-2 text-3xl">
            See everything <ArrowRight className="size-5 transition group-hover:translate-x-1" />
          </h3>
        </Link>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Search, title: 'Find your event', text: 'Search by name or venue, then filter by category, city, date and price.' },
  { icon: Ticket, title: 'Book in three steps', text: 'Your details, your seats, a quick review. Every field is checked as you type.' },
  { icon: ShieldCheck, title: 'Walk in with a QR pass', text: 'Your pass is saved on this device and your account. Add it to your calendar in one tap.' },
];

function HowItWorks() {
  return (
    <section className="shell mt-28" aria-labelledby="how-heading">
      <Reveal>
        <SectionHeading center eyebrow="How it works" title={<span id="how-heading">From browsing to booked in under a minute</span>} />
      </Reveal>
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 0.08}>
            <li className="surface h-full p-7">
              <div className="flex items-center justify-between">
                <span className="display text-5xl text-accent">0{i + 1}</span>
                <Icon className="size-5 text-subtle" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-subtle">{text}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Faq() {
  return (
    <section className="shell mt-28 grid gap-10 lg:grid-cols-[1fr_1.4fr]" aria-labelledby="faq-heading">
      <Reveal>
        <p className="eyebrow">Questions</p>
        <h2 id="faq-heading" className="display mt-3 text-4xl sm:text-5xl">
          Good to know before you book.
        </h2>
        <p className="mt-4 max-w-sm text-subtle">Can’t find what you need? Every event page lists the organiser and venue details.</p>
      </Reveal>
      <Reveal delay={0.08}>
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
      <title>EventSphere — Discover and book events across India</title>
      <Hero facets={facets} />
      <section className="shell" aria-label="This season’s events">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, ease }}>
          <DriftShowcase events={events} totals={facets?.totals} loading={isPending} />
        </motion.div>
      </section>
      <Stats facets={facets} />
      <Featured events={events} loading={isPending} />
      <Calendar events={events} loading={isPending} />
      <Categories facets={facets} />
      <HowItWorks />
      <Faq />
    </>
  );
}
