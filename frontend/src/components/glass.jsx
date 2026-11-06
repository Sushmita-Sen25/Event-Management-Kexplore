import { motion } from 'motion/react';
import GlassSurface from '@/components/GlassSurface';
import { useTheme } from '@/hooks/theme';
import { cn } from '@/lib/misc';

/**
 * A layout box with the React Bits <GlassSurface> painted behind its children.
 *
 * GlassSurface clips its own content (overflow: hidden), which would cut off dropdowns
 * such as the account menu, so it sits in an absolutely positioned backdrop layer and the
 * children render normally on top of it (see `.es-glass-host` in index.css).
 */
export function Glass({ as: Tag = 'div', radius = 18, frost, blur = 8, className, style, children, ...props }) {
  const { dark } = useTheme();
  return (
    <Tag className={cn('es-glass-host relative', className)} style={{ borderRadius: radius, ...style }} {...props}>
      <span className="es-glass-bg pointer-events-none absolute inset-0" aria-hidden>
        <GlassSurface
          width="100%"
          height="100%"
          borderRadius={radius}
          backgroundOpacity={frost ?? (dark ? 0.45 : 0.55)}
          saturation={1.5}
          distortionScale={-150}
          className="es-glass"
          style={{ '--es-glass-blur': `${blur}px` }}
        />
      </span>
      {children}
    </Tag>
  );
}

/**
 * Segmented tab bar on a glass track with a sliding highlight.
 * `tabs` is a list of { value, label, count? }.
 */
export function GlassTabs({ tabs, value, onChange, label, layoutId, className, size = 'md' }) {
  return (
    // The glass stays put while the inner row scrolls sideways on narrow screens.
    <Glass radius={size === 'sm' ? 14 : 18} className={cn('inline-flex max-w-full', className)}>
      <div
        role="tablist"
        aria-label={label}
        className="no-scrollbar flex min-w-0 gap-1 overflow-x-auto p-1"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          e.preventDefault();
          const index = tabs.findIndex((t) => t.value === value);
          const next = tabs[(index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
          onChange(next.value);
          e.currentTarget.querySelector(`[data-tab="${CSS.escape(String(next.value))}"]`)?.focus();
        }}
      >
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              data-tab={tab.value}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.value)}
              className={cn(
                'relative shrink-0 rounded-[14px] font-medium transition-colors',
                size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-sm',
                active ? 'text-text' : 'text-subtle hover:text-text',
              )}
            >
              {active && <GlassPill layoutId={layoutId} />}
              <span className="relative inline-flex items-center gap-1.5">
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn('rounded-md px-1.5 font-mono text-[11px]', active ? 'bg-accent-soft text-accent' : 'text-subtle')}>{tab.count}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </Glass>
  );
}

/** The sliding "selected" lozenge used inside glass tab bars and toggles. */
export function GlassPill({ layoutId, className }) {
  return (
    <motion.span
      layoutId={layoutId}
      className={cn(
        'absolute inset-0 rounded-[inherit] bg-white shadow-[0_6px_16px_-8px_rgb(255_105_180/0.45)] ring-1 ring-hot/20',
        'dark:bg-candy/12 dark:shadow-[0_6px_18px_-8px_rgb(0_0_0/0.8)] dark:ring-candy/30',
        className,
      )}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
    />
  );
}
