import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import DriftWall from '@/components/DriftWall';
import { imageSized } from '@/lib/format';
import { cn } from '@/lib/misc';
import { Skeleton } from './ui';

// Columns and tile size scale with the viewport so the wall always fills its box.
const LAYOUTS = [
  { min: 1100, columns: 6, tileWidth: 200, tileHeight: 134, gap: 16 },
  { min: 700, columns: 5, tileWidth: 180, tileHeight: 120, gap: 14 },
  { min: 0, columns: 4, tileWidth: 140, tileHeight: 94, gap: 10 },
];
const pickLayout = () => LAYOUTS.find((l) => window.innerWidth >= l.min);

function useWallLayout() {
  const [layout, setLayout] = useState(pickLayout);
  useEffect(() => {
    const onResize = () =>
      setLayout((current) => {
        const next = pickLayout();
        return next.min === current.min ? current : next;
      });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return layout;
}

// Soft edges on all four sides so the wall dissolves into the page instead of sitting in a box.
const EDGE_MASK = {
  maskImage: 'linear-gradient(to right, transparent, #000 14%, #000 88%, transparent), linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent)',
  maskComposite: 'intersect',
  WebkitMaskImage:
    'linear-gradient(to right, transparent, #000 14%, #000 88%, transparent), linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent)',
  WebkitMaskComposite: 'source-in',
};

/**
 * Every upcoming event on React Bits' DriftWall, used as the hero image.
 * Hover lifts a tile; clicking it opens that event.
 */
export function DriftShowcase({ events, loading, className }) {
  const navigate = useNavigate();
  const { min: _min, ...layout } = useWallLayout();
  const items = useMemo(() => events.map((e) => ({ image: imageSized(e.image, 480), title: e.title, slug: e.slug })), [events]);

  return (
    <div className={cn('es-wall relative overflow-hidden', className)} style={EDGE_MASK}>
      {loading || !items.length ? (
        <div className="grid h-full grid-cols-3 content-center gap-4 p-8">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <DriftWall
          items={items}
          {...layout}
          tilt={16}
          turn={-14}
          speed={26}
          dim={0.72}
          fade={0.5}
          lift={60}
          overlayColor="var(--wall-overlay)"
          decorative
          onSelect={(item) => navigate(`/events/${item.slug}`)}
        />
      )}
    </div>
  );
}
