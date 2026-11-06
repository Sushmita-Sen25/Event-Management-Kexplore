import { ArrowRight, ChevronDown, LoaderCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { forwardRef, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { useCountdown } from '@/hooks/data';
import { demandLabel } from '@/lib/format';
import { cn } from '@/lib/misc';

/* ---------------------------------------------------------------- Button */
const VARIANTS = {
  primary: 'bg-cta text-on-cta hover:bg-cta-hover',
  inverse: 'bg-text text-canvas hover:opacity-90',
  outline: 'border border-line-strong text-text hover:border-text/30 hover:bg-accent-soft',
  ghost: 'text-subtle hover:bg-accent-soft hover:text-text',
  danger: 'border border-danger/30 text-danger hover:bg-danger/10',
};
const SIZES = {
  sm: 'h-9 gap-1.5 rounded-lg px-3.5 text-sm',
  md: 'h-11 gap-2 rounded-[10px] px-5 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-[0.95rem]',
  icon: 'size-10 rounded-[10px]',
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

/** Quiet text link with a trailing arrow, used for "see all" style actions. */
export function TextLink({ to, children, className }) {
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-1.5 text-sm font-medium text-text underline-offset-4 hover:underline', className)}>
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

/* ---------------------------------------------------------------- Badge */
const TONES = {
  neutral: 'border-line bg-sunken text-subtle',
  accent: 'border-transparent bg-accent-soft text-accent',
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  danger: 'border-danger/25 bg-danger/10 text-danger',
  solid: 'border-transparent bg-cta text-on-cta',
};
export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- Layout helpers */
/**
 * Brand mark: a hot-pink admission ticket (notched sides) carrying a lowercase "e".
 * Same artwork as public/favicon.svg.
 */
export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7 shrink-0', className)} aria-hidden>
      <path
        fill="#ff69b4"
        d="M6.5 4h19a4.5 4.5 0 0 1 4.5 4.5v4.1a3.4 3.4 0 0 0 0 6.8v4.1a4.5 4.5 0 0 1-4.5 4.5h-19A4.5 4.5 0 0 1 2 23.5v-4.1a3.4 3.4 0 0 0 0-6.8V8.5A4.5 4.5 0 0 1 6.5 4Z"
      />
      <path fill="none" stroke="#2a1320" strokeWidth="3" strokeLinecap="round" d="M10 16h12a6 6 0 1 0-1.4 3.86" />
    </svg>
  );
}

/** Logo: the ticket mark and the name set in the display serif. */
export function Logo({ className }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2', className)} aria-label="Eventique home">
      <LogoMark />
      <span className="display text-[1.6rem] leading-none tracking-[-0.01em]">Eventique</span>
    </Link>
  );
}

export function SectionHeading({ title, description, action, className, id }) {
  return (
    <div className={cn('flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-2xl">
        <h2 id={id} className="display text-[2.15rem] sm:text-[2.6rem]">
          {title}
        </h2>
        {description && <p className="mt-2 text-subtle">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Reveal({ children, delay = 0, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export const Skeleton = ({ className }) => <div className={cn('skeleton', className)} aria-hidden />;

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center">
      {Icon && <Icon className="mb-4 size-6 text-subtle" strokeWidth={1.5} aria-hidden />}
      <h3 className="display text-[2rem]">{title}</h3>
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
    'focus:border-hot focus:ring-4 focus:ring-hot/20',
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
/**
 * Live countdown. `compact` is an inline "8d 11h 05m"; the default is a single
 * row of figures with small unit labels, ticking every second.
 */
export function Countdown({ target, compact = false, className }) {
  const { done, days, hours, minutes, seconds } = useCountdown(target);
  if (done) return null;
  const pad = (n) => String(n).padStart(2, '0');
  if (compact) {
    return (
      <span className={cn('tabular-nums', className)}>
        {days}d {pad(hours)}h {pad(minutes)}m
      </span>
    );
  }
  const units = [
    [days, days === 1 ? 'day' : 'days'],
    [pad(hours), 'hrs'],
    [pad(minutes), 'min'],
    [pad(seconds), 'sec'],
  ];
  return (
    <div role="timer" aria-label={`${days} days ${hours} hours ${minutes} minutes to go`} className={cn('flex items-baseline gap-x-4 tabular-nums', className)}>
      {units.map(([value, label]) => (
        <span key={label} className="whitespace-nowrap">
          <span className="text-2xl font-medium tracking-tight text-text">{value}</span>
          <span className="ml-1 text-xs text-subtle">{label}</span>
        </span>
      ))}
    </div>
  );
}

export function SeatMeter({ event, className }) {
  const { label, tone, share } = demandLabel(event);
  return (
    <div className={className}>
      <div className="mb-2 flex justify-between text-sm">
        <span className={cn(tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : 'text-subtle')}>{label}</span>
        <span className="text-subtle tabular-nums">{Math.round(share * 100)}% booked</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-line">
        <motion.div
          className={cn('h-full rounded-full', tone === 'danger' ? 'bg-danger' : 'bg-hot')}
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(3, share * 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
