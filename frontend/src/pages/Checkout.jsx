import { GoogleLogin } from '@react-oauth/google';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Lock, MapPin, Minus, Plus } from 'lucide-react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { BookingSlider } from '@/components/commit';
import { Button, EmptyState, Field, SelectInput, Skeleton, TextInput } from '@/components/ui';
import { useEvent, useEvents } from '@/hooks/data';
import { useSession } from '@/hooks/session';
import { useTheme } from '@/hooks/theme';
import { api } from '@/lib/api';
import { bookingsStore, fromApi } from '@/lib/bookings-store';
import { formatFullDate, formatPrice, formatTime, imageSized, phaseOf, seatsLeft } from '@/lib/format';
import { cn } from '@/lib/misc';
import { checks, formatPhone, MAX_SEATS, normalisePhone, STEP_FIELDS, validate } from '@/lib/validation';
import NotFound from './NotFound';

const STEPS = ['Your details', 'Seats', 'Review'];
const PROFILE_KEY = 'eventsphere.profile';
const STEP_OF = { eventId: 0, name: 0, email: 0, phone: 0, city: 0, seats: 1, terms: 2 };

function savedProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function Stepper({ step }) {
  return (
    <ol className="flex items-center gap-3" aria-label="Checkout progress">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-3" aria-current={i === step ? 'step' : undefined}>
          <span
            className={cn(
              'grid size-8 shrink-0 place-items-center rounded-full border text-sm font-medium transition',
              i < step && 'border-transparent bg-cta text-white',
              i === step && 'border-lavender text-accent',
              i > step && 'border-line text-subtle',
            )}
          >
            {i < step ? <Check className="size-4" /> : i + 1}
          </span>
          <span className={cn('hidden text-sm sm:inline', i === step ? 'font-medium' : 'text-subtle')}>{label}</span>
          {i < STEPS.length - 1 && <span className={cn('h-px flex-1', i < step ? 'bg-cta' : 'bg-line')} />}
        </li>
      ))}
    </ol>
  );
}

function OrderSummary({ event, seats }) {
  return (
    <div className="surface overflow-hidden">
      <img src={imageSized(event.image, 760)} alt="" className="aspect-[16/9] w-full object-cover" />
      <div className="p-6">
        <p className="eyebrow">Summary</p>
        <h2 className="mt-2 text-lg font-semibold leading-snug">{event.title}</h2>
        <ul className="mt-4 space-y-2 text-sm text-subtle">
          <li className="flex gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0" />{formatFullDate(event.startsAt)}, {formatTime(event.startsAt)}</li>
          <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{event.venue.name}, {event.venue.city}</li>
        </ul>
        <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-subtle">{event.price ? `${seats} × ${formatPrice(event.price)}` : `${seats} free seat${seats > 1 ? 's' : ''}`}</dt>
            <dd>{formatPrice(event.price * seats)}</dd>
          </div>
          <div className="flex justify-between"><dt className="text-subtle">Booking fee</dt><dd>₹0</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(event.price * seats)}</dd></div>
        </dl>
        <p className="mt-4 flex items-center gap-2 text-xs text-subtle"><Lock className="size-3.5" /> Pay at the venue · cancel any time</p>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signIn } = useSession();
  const { dark } = useTheme();
  const { data, isPending, isError, error } = useEvent(slug);
  const { data: upcoming } = useEvents({ when: 'upcoming', limit: 48 });

  const event = data?.event;
  const available = event ? seatsLeft(event) : MAX_SEATS;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(() => {
    const p = savedProfile();
    return { eventId: '', name: p.name ?? '', email: p.email ?? '', phone: p.phone ?? '', city: p.city ?? '', seats: Number(params.get('seats')) || 1, terms: false };
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [shakeScope, animateShake] = useAnimate();
  const formRef = useRef(null);
  const createdRef = useRef(null);
  const [slideError, setSlideError] = useState('Booking failed');

  useEffect(() => {
    if (event) setValues((v) => ({ ...v, eventId: event.id, seats: Math.min(Math.max(1, v.seats), Math.max(1, Math.min(MAX_SEATS, seatsLeft(event)))) }));
  }, [event]);
  useEffect(() => {
    if (user) setValues((v) => ({ ...v, name: v.name || user.name, email: v.email || user.email }));
  }, [user]);

  const options = useMemo(() => (upcoming?.items ?? []).filter((e) => seatsLeft(e) > 0 || e.id === event?.id), [upcoming, event]);

  const fieldError = (name) => (touched[name] ? errors[name] : undefined);
  const update = (name, value) => {
    const next = { ...values, [name]: value };
    setValues(next);
    if (touched[name]) setErrors((e) => ({ ...e, [name]: validate(next, [name], { available })[name] }));
  };
  const blur = (name) => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((e) => ({ ...e, [name]: validate(values, [name], { available })[name] }));
  };

  const booking = useMutation({
    mutationFn: () =>
      api.book({
        eventId: values.eventId,
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: `+91${normalisePhone(values.phone)}`,
        city: values.city.trim(),
        seats: values.seats,
      }),
    onSuccess: ({ booking: created }) => {
      bookingsStore.save(fromApi(created));
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: values.name.trim(), email: values.email.trim(), phone: values.phone, city: values.city.trim() }));
      } catch {
        /* ignore */
      }
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['facets'] });
      createdRef.current = created.reference;
    },
    onError: (err) => {
      if (err.fields) {
        setErrors((e) => ({ ...e, ...err.fields }));
        setTouched((t) => ({ ...t, ...Object.fromEntries(Object.keys(err.fields).map((k) => [k, true])) }));
        const first = Object.keys(err.fields).find((k) => k in STEP_OF);
        if (first !== undefined) setStep(STEP_OF[first]);
      }
      toast.error(err.message);
      queryClient.invalidateQueries({ queryKey: ['event', slug] });
    },
  });

  /** Validates the current step, marking and focusing the first problem. */
  const checkStep = () => {
    const fields = STEP_FIELDS[step];
    const found = validate(values, fields, { available });
    if (step === 0 && !found.email) {
      const existing = bookingsStore.activeFor(values.eventId, values.email);
      if (existing) found.email = `You already booked this event with this email (${existing.reference})`;
    }
    setErrors((e) => ({ ...Object.fromEntries(Object.entries(e).filter(([k]) => !fields.includes(k))), ...found }));
    setTouched((t) => ({ ...t, ...Object.fromEntries(fields.map((f) => [f, true])) }));
    if (Object.keys(found).length) {
      // Shake in place (no remount), then move focus to the first field that needs attention.
      animateShake(shakeScope.current, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.4 });
      const first = fields.find((f) => found[f]);
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return false;
    }
    return true;
  };

  const next = () => {
    if (!checkStep()) return;
    if (step < 2) setStep(step + 1);
    // On the review step the booking is committed by the slider, so Enter just hands focus to it.
    else formRef.current?.querySelector('[role="slider"]')?.focus();
  };

  // SlideCommit treats a rejected promise as a failed slide (shake + error label) and a resolved one as done.
  const confirmBooking = () => {
    if (!checkStep()) {
      setSlideError('Accept the terms first');
      return Promise.reject(new Error('terms'));
    }
    setSlideError('Booking failed');
    return booking.mutateAsync();
  };

  if (isPending) {
    return (
      <div className="shell grid gap-10 py-12 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-[480px] rounded-[20px]" />
        <Skeleton className="h-[420px] rounded-[20px]" />
      </div>
    );
  }
  if (isError && error.status === 404) return <NotFound title="That event doesn’t exist" />;
  if (isError) return <div className="shell py-20"><EmptyState title="Couldn’t load checkout">{error.message}</EmptyState></div>;
  if (phaseOf(event) === 'ended' || seatsLeft(event) === 0) {
    return (
      <div className="shell py-20">
        <EmptyState title={phaseOf(event) === 'ended' ? 'This event has ended' : 'This event is sold out'} action={<Link to="/events" className="text-accent underline">Browse other events</Link>} />
      </div>
    );
  }

  const max = Math.max(1, Math.min(MAX_SEATS, available));

  return (
    <>
      <title>{`Book ${event.title} · EventSphere`}</title>
      <div className="shell py-10">
        <Link to={`/events/${event.slug}`} className="inline-flex items-center gap-1.5 text-sm text-subtle hover:text-text">
          <ArrowLeft className="size-4" /> Back to event
        </Link>
        <h1 className="display mt-6 text-5xl">Book your seats</h1>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_380px]">
          <form
            ref={formRef}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
            className="surface p-6 sm:p-8"
          >
            <Stepper step={step} />
            <div ref={shakeScope}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="mt-8 space-y-5">
                  {step === 0 && (
                    <>
                      {!user && (
                        <div className="flex flex-col gap-3 rounded-xl bg-sunken/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-subtle">Sign in with Google to fill in your details and see your bookings on any device.</p>
                          <div className="[color-scheme:light]">
                            <GoogleLogin onSuccess={(r) => signIn(r.credential)} theme={dark ? 'filled_black' : 'outline'} shape="pill" size="medium" text="continue_with" />
                          </div>
                        </div>
                      )}
                      <Field label="Event" id="eventId" error={fieldError('eventId')}>
                        <SelectInput
                          id="eventId"
                          name="eventId"
                          value={values.eventId}
                          invalid={Boolean(fieldError('eventId'))}
                          onChange={(e) => {
                            const chosen = options.find((o) => o.id === e.target.value);
                            if (chosen && chosen.slug !== slug) navigate(`/checkout/${chosen.slug}?seats=${values.seats}`, { replace: true });
                          }}
                        >
                          {options.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.title} · {formatFullDate(o.startsAt)}
                            </option>
                          ))}
                        </SelectInput>
                      </Field>
                      <Field label="Full name" id="name" error={fieldError('name')}>
                        <TextInput id="name" name="name" autoComplete="name" placeholder="As it should appear on your pass" value={values.name} onChange={(e) => update('name', e.target.value)} onBlur={() => blur('name')} invalid={Boolean(fieldError('name'))} aria-describedby="name-error" />
                      </Field>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Email" id="email" error={fieldError('email')} hint="Your pass appears on screen straight away.">
                          <TextInput id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={(e) => update('email', e.target.value)} onBlur={() => blur('email')} invalid={Boolean(fieldError('email'))} aria-describedby="email-error email-hint" />
                        </Field>
                        <Field label="Mobile number" id="phone" error={fieldError('phone')} hint="10-digit Indian mobile number">
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-subtle">+91</span>
                            <TextInput id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" className="pl-12 font-mono" value={values.phone} onChange={(e) => update('phone', formatPhone(e.target.value))} onBlur={() => blur('phone')} invalid={Boolean(fieldError('phone'))} aria-describedby="phone-error phone-hint" />
                          </div>
                        </Field>
                      </div>
                      <Field label="City" id="city" optional error={fieldError('city')}>
                        <TextInput id="city" name="city" autoComplete="address-level2" placeholder="Where are you travelling from?" value={values.city} onChange={(e) => update('city', e.target.value)} onBlur={() => blur('city')} invalid={Boolean(fieldError('city'))} />
                      </Field>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <div>
                        <p className="text-sm font-medium">How many seats?</p>
                        <p className="text-sm text-subtle">Up to {max} for this booking · {available} left for this event</p>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-line p-3 pl-5">
                        <div>
                          <p className="display text-4xl">{values.seats}</p>
                          <p className="text-sm text-subtle">{values.seats === 1 ? 'seat' : 'seats'} · {formatPrice(event.price * values.seats)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" name="seats" onClick={() => update('seats', Math.max(1, values.seats - 1))} disabled={values.seats <= 1} aria-label="One fewer seat">
                            <Minus className="size-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => update('seats', Math.min(max, values.seats + 1))} disabled={values.seats >= max} aria-label="One more seat">
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      </div>
                      {fieldError('seats') && <p role="alert" className="text-sm text-danger">{fieldError('seats')}</p>}
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                          <button key={n} type="button" onClick={() => update('seats', n)} aria-pressed={values.seats === n} className={cn('rounded-xl border py-3 font-mono text-sm transition', values.seats === n ? 'border-lavender bg-accent-soft text-accent' : 'border-line hover:border-line-strong')}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <dl className="divide-y divide-line rounded-2xl border border-line">
                        {[
                          ['Event', event.title],
                          ['When', `${formatFullDate(event.startsAt)}, ${formatTime(event.startsAt)}`],
                          ['Name', values.name],
                          ['Email', values.email],
                          ['Mobile', `+91 ${formatPhone(values.phone)}`],
                          ['Seats', values.seats],
                          ['Total', formatPrice(event.price * values.seats)],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-6 px-4 py-3 text-sm">
                            <dt className="text-subtle">{k}</dt>
                            <dd className="text-right font-medium">{v}</dd>
                          </div>
                        ))}
                      </dl>
                      <label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm', fieldError('terms') ? 'border-danger/60 bg-danger/5' : 'border-line')}>
                        <input
                          type="checkbox"
                          name="terms"
                          checked={values.terms}
                          onChange={(e) => {
                            update('terms', e.target.checked);
                            setTouched((t) => ({ ...t, terms: true }));
                            setErrors((er) => ({ ...er, terms: checks.terms(e.target.checked) }));
                          }}
                          className="mt-0.5 size-4 accent-[#722548]"
                        />
                        <span>
                          I agree to the <Link to="/terms" className="text-accent underline">booking terms</Link> and understand my details are shared with the organiser for check-in.
                          {fieldError('terms') && <span role="alert" className="mt-1 block text-danger">{fieldError('terms')}</span>}
                        </span>
                      </label>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className={cn('mt-8 flex gap-3 border-t border-line pt-6', step === 2 ? 'flex-col-reverse sm:flex-row sm:items-center sm:justify-between' : 'items-center justify-between')}>
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={booking.isPending || booking.isSuccess} className="self-start sm:self-auto">
                  <ArrowLeft className="size-4" /> Back
                </Button>
              ) : (
                <span />
              )}
              {step < 2 ? (
                <Button type="submit" size="lg">
                  Continue <ArrowRight className="size-4" />
                </Button>
              ) : (
                <BookingSlider
                  label={event.price ? `Slide to book · ${formatPrice(event.price * values.seats)}` : 'Slide to book free seats'}
                  errorLabel={slideError}
                  onConfirm={confirmBooking}
                  onDone={() => setTimeout(() => createdRef.current && navigate(`/bookings/${createdRef.current}?new=1`), 700)}
                />
              )}
            </div>
          </form>

          <aside className="lg:sticky lg:top-24">
            <OrderSummary event={event} seats={values.seats} />
          </aside>
        </div>
      </div>
    </>
  );
}
