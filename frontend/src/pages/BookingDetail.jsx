import { useQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { ArrowLeft, CalendarPlus, CheckCircle2, Printer, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Button, ButtonLink, Countdown, EmptyState, Skeleton } from '@/components/ui';
import { useLocalBookings } from '@/hooks/data';
import { api } from '@/lib/api';
import { bookingsStore, fromApi } from '@/lib/bookings-store';
import { formatFullDate, formatPrice, formatTimeRange, imageSized, phaseOf } from '@/lib/format';
import { addToCalendar, cn } from '@/lib/misc';

function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#541533', '#722548', '#77568b', '#9682b9', '#f4ecf6'];
  confetti({ particleCount: 110, spread: 85, origin: { y: 0.35 }, colors, zIndex: 200 });
  setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.3 }, colors, zIndex: 200 }), 250);
}

/** The pass: event details on the left, a tear-off stub with the QR code on the right. */
function Pass({ booking }) {
  const event = booking.event;
  const cancelled = booking.status === 'cancelled';
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-night via-[#1d1129] to-wine text-white shadow-[0_40px_80px_-40px_rgb(84_21_51/0.9)]">
      <div className="grid md:grid-cols-[1fr_260px]">
        <div className="p-7 sm:p-9">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-tight">Event<span className="text-lavender">Sphere</span></span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em]">Admit {booking.seats}</span>
          </div>
          <h2 className="display mt-8 text-4xl sm:text-5xl">{event.title}</h2>
          <dl className="mt-8 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            {[
              ['Date', formatFullDate(event.startsAt)],
              ['Time', formatTimeRange(event.startsAt, event.endsAt)],
              ['Venue', `${event.venue?.name}, ${event.venue?.city}`],
              ['Attendee', booking.attendee?.name],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">{k}</dt>
                <dd className="mt-1 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative flex flex-col items-center justify-center gap-4 border-t-2 border-dashed border-white/20 p-7 md:border-l-2 md:border-t-0">
          <span aria-hidden className="absolute -top-4 left-1/2 hidden size-8 -translate-x-1/2 rounded-full bg-canvas md:-left-4 md:top-1/2 md:block md:-translate-y-1/2 md:translate-x-0" />
          <div className={cn('rounded-2xl bg-white p-3', cancelled && 'opacity-30')}>
            <QRCodeSVG value={`${window.location.origin}/bookings/${booking.reference}`} size={148} fgColor="#221932" level="M" />
          </div>
          <div className="text-center">
            <p className="font-mono text-lg font-semibold tracking-wider text-lavender">{booking.reference}</p>
            <p className="text-xs text-white/60">{formatPrice(booking.total)} · pay at venue</p>
          </div>
        </div>
      </div>
      {cancelled && (
        <div className="absolute inset-0 grid place-items-center bg-ink/50">
          <span className="-rotate-12 rounded-xl border-4 border-[#ec7598] px-6 py-2 font-mono text-2xl font-bold uppercase tracking-[0.2em] text-[#ec7598]">Cancelled</span>
        </div>
      )}
    </div>
  );
}

export default function BookingDetail() {
  const { reference } = useParams();
  const [params] = useSearchParams();
  const isNew = params.get('new') === '1';
  const ref = reference.toUpperCase();
  const bookings = useLocalBookings();
  const local = bookings.find((b) => b.reference === ref);
  const celebrated = useRef(false);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['booking', ref],
    queryFn: async () => {
      const { booking } = await api.booking(ref);
      if (bookingsStore.find(ref)) bookingsStore.merge([booking]); // refresh status, keep unmasked details
      return fromApi(booking);
    },
    retry: 1,
  });

  useEffect(() => {
    if (isNew && !celebrated.current) {
      celebrated.current = true;
      celebrate();
    }
  }, [isNew]);

  const booking = local ?? data;

  if (!booking && isPending) {
    return (
      <div className="shell py-12">
        <Skeleton className="h-80 rounded-[28px]" />
      </div>
    );
  }
  if (!booking) {
    return (
      <div className="shell py-20">
        <EmptyState icon={Ticket} title="Booking not found" action={<ButtonLink to="/bookings">My bookings</ButtonLink>}>
          {isError ? error.message : `There’s no booking with reference ${ref}.`}
        </EmptyState>
      </div>
    );
  }

  const event = booking.event;
  const upcoming = booking.status === 'confirmed' && phaseOf(event) === 'upcoming';

  return (
    <>
      <title>{`Booking ${ref} · EventSphere`}</title>
      <div className="shell py-10">
        <Link to="/bookings" className="no-print inline-flex items-center gap-1.5 text-sm text-subtle hover:text-text">
          <ArrowLeft className="size-4" /> My bookings
        </Link>

        {isNew && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="no-print mt-6 flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-5">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
            <div>
              <p className="font-semibold">Booking confirmed — see you there, {booking.attendee?.name?.split(' ')[0]}!</p>
              <p className="mt-1 text-sm text-subtle">Your pass is saved on this device. Show the QR code at the entrance, or quote reference {ref}.</p>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="mt-8">
          <Pass booking={booking} />
        </motion.div>

        <div className="no-print mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          {upcoming ? (
            <div className="max-w-md">
              <p className="mb-2 text-xs uppercase tracking-wider text-subtle">Doors open in</p>
              <Countdown target={event.startsAt} />
            </div>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap gap-2">
            {upcoming && (
              <Button variant="outline" onClick={() => addToCalendar(event, ref)}>
                <CalendarPlus className="size-4" /> Add to calendar
              </Button>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </Button>
            <ButtonLink to={`/events/${event.slug}`} variant="ghost">
              Event details
            </ButtonLink>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-line">
          <img src={imageSized(event.image, 1600)} alt="" className="h-48 w-full object-cover opacity-80" />
        </div>
        {!local && <p className="mt-4 text-sm text-subtle">You’re viewing a shared pass — contact details are partly hidden for privacy.</p>}
      </div>
    </>
  );
}
