import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import DriftWall from '@/components/DriftWall';
import { formatMediumDate, formatNumber, formatTime, imageSized } from '@/lib/format';
import { Countdown, Skeleton } from './ui';

// Columns and tile size scale with the viewport so the wall always fills the frame.
const LAYOUTS = [
  { min: 1100, columns: 6, tileWidth: 220, tileHeight: 146, gap: 18 },
  { min: 700, columns: 5, tileWidth: 190, tileHeight: 126, gap: 14 },
  { min: 0, columns: 3, tileWidth: 150, tileHeight: 100, gap: 12 },
];
const pickLayout = () => LAYOUTS.find((l) => window.innerWidth >= l.min);

function useWallLayout() {
  const [layout, setLayout] = useState(pickLayout);
  useEffect(() => {
    const onResize = () => setLayout((current) => {
      const next = pickLayout();
      return next.min === current.min ? current : next;
    });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return layout;
}

/**
 * Framed showcase of every upcoming event on React Bits' DriftWall.
 * Hover lifts a tile; clicking it opens that event.
 */
export function DriftShowcase({ events, totals, loading }) {
  const navigate = useNavigate();
  const { min: _min, ...layout } = useWallLayout();
  const items = useMemo(() => events.map((e) => ({ image: imageSized(e.image, 520), title: e.title, slug: e.slug })), [events]);
  const next = events[0];

  return (
    <div className="es-wall relative h-[440px] overflow-hidden rounded-[28px] border border-line bg-panel sm:h-[520px] lg:h-[600px]">
      {loading || !items.length ? (
        <div className="grid h-full grid-cols-3 gap-4 p-6 md:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <DriftWall
          items={items}
          {...layout}
          tilt={18}
          turn={-12}
          speed={30}
          dim={0.72}
          fade={0.5}
          lift={72}
          overlayColor="var(--wall-overlay)"
          decorative
          onSelect={(item) => navigate(`/events/${item.slug}`)}
        />
      )}

      {/* Edge fades blend the wall into the frame */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-panel to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-panel via-panel/70 to-transparent" />

      {next && (
        <div className="glass absolute bottom-4 left-4 right-4 flex flex-col gap-4 rounded-2xl border border-line p-4 sm:right-auto sm:w-[360px] sm:p-5">
          <div>
            <p className="eyebrow">Next up</p>
            <Link to={`/events/${next.slug}`} className="mt-1.5 block text-lg font-semibold leading-snug hover:text-accent">
              {next.title}
            </Link>
            <p className="mt-0.5 text-sm text-subtle">
              {formatMediumDate(next.startsAt)} · {formatTime(next.startsAt)} · {next.venue.city}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
            <span className="text-subtle">
              Starts in <Countdown target={next.startsAt} compact className="font-semibold text-text" />
            </span>
            <Link to={`/events/${next.slug}`} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
              Book <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}

      {totals && (
        <div className="glass absolute right-4 top-4 hidden items-center gap-3 rounded-2xl border border-line px-4 py-3 md:flex">
          <span className="grid size-9 place-items-center rounded-xl bg-cta text-white">
            <Sparkles className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="font-mono text-lg font-semibold">{formatNumber(totals.seatsBooked)}</p>
            <p className="text-xs text-subtle">seats booked this season</p>
          </div>
        </div>
      )}
    </div>
  );
}
