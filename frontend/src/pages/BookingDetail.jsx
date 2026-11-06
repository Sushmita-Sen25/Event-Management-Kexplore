import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarPlus, CheckCircle2, Printer, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Button, ButtonLink, Countdown, EmptyState, Skeleton } from '@/components/ui';
import { useLocalBookings } from '@/hooks/data';
import { api } from '@/lib/api';
import { bookingsStore, fromApi } from '@/lib/bookings-store';
import { formatFullDate, formatPrice, formatTimeRange, phaseOf } from '@/lib/format';
import { addToCalendar, cn } from '@/lib/misc';

/** The pass: event details on the left, a tear-off stub with the QR code on the right. */
function Pass({ booking }) {
  const event = booking.event;
  const cancelled = booking.status === 'cancelled';
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-night text-white">
      <div className="grid md:grid-cols-[1fr_260px]">
        <div className="p-7 sm:p-9">
          <div className="flex items-center justify-between">
            <span className="display text-xl leading-none">EventSphere</span>
            <span className="text-xs uppercase tracking-[0.12em] text-white/70">Admit {booking.seats}</span>
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
                <dt className="text-[11px] uppercase tracking-[0.1em] text-white/55">{k}</dt>
                <dd className="mt-1 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative flex flex-col items-center justify-center gap-4 border-t border-dashed border-white/25 bg-wine/45 p-7 md:border-l md:border-t-0">
          <span aria-hidden className="absolute -top-4 left-1/2 hidden size-8 -translate-x-1/2 rounded-full bg-canvas md:-left-4 md:top-1/2 md:block md:-translate-y-1/2 md:translate-x-0" />
          <div className={cn('rounded-2xl bg-white p-3', cancelled && 'opacity-30')}>
            <QRCodeSVG value={`${window.location.origin}/bookings/${booking.reference}`} size={148} fgColor="#221932" level="M" />
          </div>
          <div className="text-center">
            <p className="font-mono text-lg font-medium tracking-wider">{booking.reference}</p>
            <p className="text-xs text-white/65">{formatPrice(booking.total)} · pay at the venue</p>
          </div>
        </div>
      </div>
      {cancelled && (
        <div className="absolute inset-0 grid place-items-center bg-ink/50">
          <span className="rounded-lg border-2 border-white/80 px-5 py-1.5 text-lg font-semibold uppercase tracking-[0.2em] text-white">Cancelled</span>
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

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['booking', ref],
    queryFn: async () => {
      const { booking } = await api.booking(ref);
      if (bookingsStore.find(ref)) bookingsStore.merge([booking]); // refresh status, keep unmasked details
      return fromApi(booking);
    },
    retry: 1,
  });

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
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="no-print mt-6 flex items-start gap-3 border-l-2 border-success py-1 pl-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
            <div>
              <p className="font-semibold">Booking confirmed. See you there, {booking.attendee?.name?.split(' ')[0]}.</p>
              <p className="mt-1 text-sm text-subtle">Show the QR code at the entrance or quote reference {ref}. The pass is saved on this device.</p>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="mt-8">
          <Pass booking={booking} />
        </motion.div>

        <div className="no-print mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          {upcoming ? (
            <div className="max-w-md">
              <p className="mb-1.5 text-sm text-subtle">Starts in</p>
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

        {!local && <p className="mt-4 text-sm text-subtle">This is a shared pass, so contact details are partly hidden.</p>}
      </div>
    </>
  );
}
