import { ChevronDown, LoaderCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { forwardRef, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { useCountdown } from '@/hooks/data';
import { demandLabel } from '@/lib/format';
import { cn } from '@/lib/misc';

/* ---------------------------------------------------------------- Button */
const VARIANTS = {
  primary: 'bg-cta text-white shadow-[0_8px_24px_-10px_var(--glow)] hover:bg-cta-hover',
  inverse: 'bg-text text-canvas hover:opacity-90',
  outline: 'border border-line-strong text-text hover:bg-accent-soft',
  ghost: 'text-subtle hover:bg-accent-soft hover:text-text',
  danger: 'border border-danger/30 text-danger hover:bg-danger/10',
};
const SIZES = {
  sm: 'h-9 gap-1.5 rounded-lg px-3.5 text-sm',
  md: 'h-11 gap-2 rounded-xl px-5 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-[0.95rem]',
  icon: 'size-10 rounded-xl',
};

export const buttonStyles = (variant = 'primary', size = 'md', className) =>
  cn(
    'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition duration-200 ease-[var(--ease-smooth)]',
    'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

export const Button = forwardRef(function Button({ variant, size, className, loading, children, type = 'button', ...props }, ref) {
  return (
    <button ref={ref} type={type} className={buttonStyles(variant, size, className)} disabled={loading || props.disabled} {...props}>
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({ variant, size, className, ...props }) {
  return <Link className={buttonStyles(variant, size, className)} {...props} />;
}

/* ---------------------------------------------------------------- Badge */
const TONES = {
  neutral: 'border-line bg-sunken text-subtle',
  accent: 'border-transparent bg-accent-soft text-accent',
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  danger: 'border-danger/25 bg-danger/10 text-danger',
  solid: 'border-transparent bg-cta text-white',
};
export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- Layout helpers */
export function Logo({ className }) {
  return (
    <Link to="/" className={cn('group inline-flex items-center gap-2.5', className)} aria-label="EventSphere home">
      <svg viewBox="0 0 32 32" className="size-8 transition-transform duration-500 group-hover:rotate-90" aria-hidden>
        <defs>
          <linearGradient id="es-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#541533" />
            <stop offset=".5" stopColor="#722548" />
            <stop offset="1" stopColor="#77568b" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#es-logo)" />
        <circle cx="16" cy="16" r="7.5" fill="none" stroke="#f3ebf7" strokeWidth="2.6" />
        <circle cx="16" cy="16" r="2.8" fill="#9682b9" />
      </svg>
      <span className="text-[1.05rem] font-semibold tracking-tight">
        Event<span className="text-accent">Sphere</span>
      </span>
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, description, action, center = false, className }) {
  return (
    <div className={cn('flex flex-col gap-5 md:flex-row md:items-end md:justify-between', center && 'items-center text-center md:flex-col md:items-center', className)}>
      <div className={cn('max-w-2xl', center && 'mx-auto')}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="display text-4xl sm:text-5xl">{title}</h2>
        {description && <p className="mt-3 text-subtle">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Reveal({ children, delay = 0, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export const Skeleton = ({ className }) => <div className={cn('skeleton', className)} aria-hidden />;

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="surface flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 grid size-12 place-items-center rounded-xl bg-accent-soft text-accent">
          <Icon className="size-5" />
        </span>
      )}
      <h3 className="display text-3xl">{title}</h3>
      {children && <p className="mt-2 max-w-md text-subtle">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- Form fields */
export function Field({ label, error, hint, optional, children, id }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
        {label}
        {optional && <span className="text-xs font-normal text-subtle">Optional</span>}
      </label>
      {children}
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p key="e" id={`${id}-error`} role="alert" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-sm text-danger">
            {error}
          </motion.p>
        ) : hint ? (
          <p key="h" id={`${id}-hint`} className="mt-1.5 text-xs text-subtle">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export const inputStyles = (invalid) =>
  cn(
    'h-11 w-full rounded-xl border bg-canvas px-3.5 text-sm text-text outline-none transition placeholder:text-subtle/70',
    'focus:border-lavender focus:ring-4 focus:ring-lavender/15',
    invalid ? 'border-danger/70 ring-4 ring-danger/10' : 'border-line-strong',
  );

export const TextInput = forwardRef(function TextInput({ invalid, className, ...props }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cn(inputStyles(invalid), className)} {...props} />;
});

export const SelectInput = forwardRef(function SelectInput({ invalid, className, children, ...props }, ref) {
  return (
    <div className="relative w-full">
      <select ref={ref} aria-invalid={invalid || undefined} className={cn(inputStyles(invalid), 'appearance-none pr-10', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
    </div>
  );
});

/* ---------------------------------------------------------------- Accordion */
export function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  const base = useId();
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <div key={item.q}>
            <h3>
              <button
                id={`${base}-b${i}`}
                aria-expanded={expanded}
                aria-controls={`${base}-p${i}`}
                onClick={() => setOpen(expanded ? -1 : i)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left font-medium"
              >
                {item.q}
                <ChevronDown className={cn('size-4 shrink-0 text-subtle transition-transform duration-300', expanded && 'rotate-180 text-accent')} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  id={`${base}-p${i}`}
                  role="region"
                  aria-labelledby={`${base}-b${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-5 pr-10 text-subtle">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- Sheet (side drawer) */
export function Sheet({ open, onClose, title, side = 'right', children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]">
          <motion.div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            data-lenis-prevent
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn('absolute inset-y-0 flex w-[min(380px,90vw)] flex-col border-line bg-raised', side === 'right' ? 'right-0 border-l' : 'left-0 border-r')}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="font-semibold">{title}</p>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------------------------------------------------------------- Event bits */
export function Countdown({ target, compact = false, className }) {
  const { done, days, hours, minutes, seconds } = useCountdown(target);
  if (done) return null;
  const units = [
    ['Days', days],
    ['Hrs', hours],
    ['Min', minutes],
    ['Sec', seconds],
  ];
  if (compact) {
    return (
      <span className={cn('font-mono tabular-nums', className)}>
        {days}d {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m
      </span>
    );
  }
  return (
    <div role="timer" aria-label={`${days} days ${hours} hours ${minutes} minutes to go`} className={cn('grid grid-cols-4 gap-2', className)}>
      {units.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-line bg-sunken/60 py-2.5 text-center">
          <span className="block font-mono text-xl font-semibold tabular-nums text-text">{String(value).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-subtle">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function SeatMeter({ event, className }) {
  const { label, tone, share } = demandLabel(event);
  return (
    <div className={className}>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className={cn(tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : 'text-subtle')}>{label}</span>
        <span className="font-mono text-subtle">{Math.round(share * 100)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
        <motion.div
          className={cn('h-full rounded-full', tone === 'danger' ? 'bg-danger' : 'bg-gradient-to-r from-plum to-lavender')}
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(3, share * 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
