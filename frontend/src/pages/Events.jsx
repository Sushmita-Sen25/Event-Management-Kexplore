import { ChevronLeft, ChevronRight, LayoutGrid, List, RotateCcw, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AgendaRow, AgendaSkeleton, EventCard, EventCardSkeleton } from '@/components/events';
import { Glass, GlassPill } from '@/components/glass';
import { Button, EmptyState, SelectInput, Sheet } from '@/components/ui';
import { useDebounced, useEvents, useFacets } from '@/hooks/data';
import { CATEGORIES, cn, PRICES, SORTS, WHEN } from '@/lib/misc';

const PAGE_SIZE = 9;
const DEFAULTS = { q: '', category: '', city: '', price: '', when: 'upcoming', sort: 'soonest', view: 'grid', page: '1' };

/** Filters live in the URL so every result page can be shared, bookmarked and navigated with Back. */
function useFilterParams() {
  const [params, setParams] = useSearchParams();
  const get = (key) => params.get(key) ?? DEFAULTS[key];
  const set = (patch, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || value === DEFAULTS[key]) next.delete(key);
      else next.set(key, value);
    });
    if (!keepPage && !('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };
  return { get, set, reset: () => setParams(new URLSearchParams(), { replace: true }) };
}

function FilterPanel({ get, set, facets }) {
  const selected = get('category') ? get('category').split(',') : [];
  const counts = Object.fromEntries((facets?.categories ?? []).map((c) => [c.name, c.count]));
  const toggleCategory = (name) => {
    const next = selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name];
    set({ category: next.join(',') });
  };
  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Category</legend>
        <div className="space-y-1">
          {CATEGORIES.map(({ name }) => (
            <label key={name} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-accent-soft">
              <input type="checkbox" checked={selected.includes(name)} onChange={() => toggleCategory(name)} className="size-4 accent-[#722548]" />
              <span className="flex-1">{name}</span>
              <span className="text-xs tabular-nums text-subtle">{counts[name] ?? 0}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">When</legend>
        <div className="space-y-1">
          {WHEN.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-accent-soft">
              <input type="radio" name="when" checked={get('when') === option.value} onChange={() => set({ when: option.value })} className="size-4 accent-[#722548]" />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Price</legend>
        <div className="space-y-1">
          {PRICES.map((option) => (
            <label key={option.value || 'any'} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-accent-soft">
              <input type="radio" name="price" checked={get('price') === option.value} onChange={() => set({ price: option.value })} className="size-4 accent-[#722548]" />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="filter-city" className="mb-3 block text-sm font-semibold">
          City
        </label>
        <SelectInput id="filter-city" value={get('city')} onChange={(e) => set({ city: e.target.value })}>
          <option value="">All cities</option>
          {(facets?.cities ?? []).map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.count})
            </option>
          ))}
        </SelectInput>
      </div>
    </div>
  );
}

function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1">
      <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </Button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={cn('size-10 rounded-[10px] text-sm tabular-nums transition', n === page ? 'bg-text text-canvas' : 'text-subtle hover:bg-accent-soft hover:text-text')}
        >
          {n}
        </button>
      ))}
      <Button variant="ghost" size="icon" disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}

export default function Events() {
  const { get, set, reset } = useFilterParams();
  const { data: facets } = useFacets();
  const [search, setSearch] = useState(get('q'));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounced = useDebounced(search, 350);

  useEffect(() => setSearch(get('q')), [get('q')]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (debounced.trim() !== get('q')) set({ q: debounced.trim() });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const page = Number(get('page')) || 1;
  const view = get('view');
  const { data, isPending, isFetching, isError, error, refetch } = useEvents({
    q: get('q'),
    category: get('category'),
    city: get('city'),
    price: get('price'),
    when: get('when'),
    sort: get('sort'),
    page,
    limit: PAGE_SIZE,
  });
  const items = data?.items ?? [];

  const chips = [
    get('q') && { key: 'q', label: `“${get('q')}”` },
    ...(get('category') ? get('category').split(',').map((c) => ({ key: 'category', value: c, label: c })) : []),
    get('city') && { key: 'city', label: get('city') },
    get('price') && { key: 'price', label: PRICES.find((p) => p.value === get('price'))?.label },
    get('when') !== 'upcoming' && { key: 'when', label: WHEN.find((w) => w.value === get('when'))?.label },
  ].filter(Boolean);

  const removeChip = (chip) => {
    if (chip.key === 'q') setSearch('');
    if (chip.key === 'category') set({ category: get('category').split(',').filter((c) => c !== chip.value).join(',') });
    else set({ [chip.key]: '' });
  };
  const clearAll = () => {
    setSearch('');
    reset();
  };

  return (
    <>
      <title>{`Events · EventSphere`}</title>
      <section className="shell pt-12">
        <nav aria-label="Breadcrumb" className="text-sm text-subtle">
          <Link to="/" className="hover:text-text">
            Home
          </Link>{' '}
          / <span className="text-text">Events</span>
        </nav>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <h1 className="display text-5xl sm:text-6xl">{get('when') === 'past' ? 'Past events' : 'All events'}</h1>
          <p className="text-sm text-subtle">{isPending ? 'Loading events…' : `${data?.total ?? 0} event${data?.total === 1 ? '' : 's'}`}</p>
        </div>
      </section>

      <div className="shell grid gap-12 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24">
            <FilterPanel get={get} set={set} facets={facets} />
            {chips.length > 0 && (
              <Button variant="ghost" size="sm" className="mt-6" onClick={clearAll}>
                <RotateCcw className="size-3.5" /> Clear all filters
              </Button>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-line-strong bg-canvas px-3.5 focus-within:border-lavender focus-within:ring-4 focus-within:ring-lavender/15">
              <Search className="size-4 shrink-0 text-subtle" aria-hidden />
              <span className="sr-only">Search events</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, venue, city or organiser" className="w-full bg-transparent text-sm outline-none placeholder:text-subtle/80" />
              {search && (
                <button onClick={() => setSearch('')} aria-label="Clear search" className="text-subtle hover:text-text">
                  <X className="size-4" />
                </button>
              )}
            </label>
            <Button variant="outline" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="size-4" /> Filters {chips.length > 0 && <span className="text-xs tabular-nums text-accent">{chips.length}</span>}
            </Button>
            <div className="w-48">
              <label htmlFor="sort" className="sr-only">
                Sort by
              </label>
              <SelectInput id="sort" value={get('sort')} onChange={(e) => set({ sort: e.target.value })}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </SelectInput>
            </div>
            <Glass radius={14} className="flex gap-0.5 p-1" role="group" aria-label="View">
              {[
                ['grid', LayoutGrid, 'Grid view'],
                ['list', List, 'List view'],
              ].map(([value, Icon, label]) => (
                <button
                  key={value}
                  onClick={() => set({ view: value }, { keepPage: true })}
                  aria-pressed={view === value}
                  aria-label={label}
                  className={cn('relative grid size-9 place-items-center rounded-[10px] transition-colors', view === value ? 'text-accent' : 'text-subtle hover:text-text')}
                >
                  {view === value && <GlassPill layoutId="view-toggle" />}
                  <Icon className="relative size-4" />
                </button>
              ))}
            </Glass>
          </div>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <button key={`${chip.key}-${chip.label}`} onClick={() => removeChip(chip)} aria-label={`Remove filter ${chip.label}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs transition hover:border-line-strong">
                  {chip.label} <X className="size-3" />
                </button>
              ))}
            </div>
          )}

          <div className={cn('mt-8 transition-opacity', isFetching && !isPending && 'opacity-60')} aria-live="polite">
            {isError ? (
              <EmptyState icon={SearchX} title="Couldn’t load events" action={<Button onClick={() => refetch()}>Try again</Button>}>
                {error.message}
              </EmptyState>
            ) : isPending ? (
              view === 'list' ? <AgendaSkeleton rows={6} /> : (
                <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => <EventCardSkeleton key={i} />)}
                </div>
              )
            ) : items.length === 0 ? (
              <EmptyState icon={SearchX} title="No events match" action={<Button variant="outline" onClick={clearAll}>Clear filters</Button>}>
                Try a different search, a wider date range or another category.
              </EmptyState>
            ) : view === 'list' ? (
              <ul className="divide-y divide-line border-y border-line">
                {items.map((event) => (
                  <AgendaRow key={event.id} event={event} />
                ))}
              </ul>
            ) : (
              <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </div>
            )}
          </div>

          <Pagination page={page} pageCount={data?.pageCount ?? 1} onChange={(n) => set({ page: String(n) })} />
        </div>
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <FilterPanel get={get} set={set} facets={facets} />
        <div className="mt-8 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={clearAll}>
            Clear
          </Button>
          <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
            Show {data?.total ?? 0} results
          </Button>
        </div>
      </Sheet>
    </>
  );
}
