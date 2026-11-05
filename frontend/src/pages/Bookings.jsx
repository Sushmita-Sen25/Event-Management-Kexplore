import { useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Cloud, Download, FileJson, HardDrive, RefreshCw, Ticket, Trash2, Upload, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Badge, Button, ButtonLink, Countdown, EmptyState } from '@/components/ui';
import { useLocalBookings } from '@/hooks/data';
import { useSession } from '@/hooks/session';
import { api } from '@/lib/api';
import { bookingsStore, download, parseBackup, toCsv } from '@/lib/bookings-store';
import { formatMediumDate, formatPrice, formatTime, imageSized } from '@/lib/format';
import { addToCalendar, cn } from '@/lib/misc';

const TABS = [
  ['upcoming', 'Upcoming'],
  ['past', 'Past'],
  ['cancelled', 'Cancelled'],
];

const groupOf = (b) => (b.status === 'cancelled' ? 'cancelled' : new Date(b.event?.endsAt) < new Date() ? 'past' : 'upcoming');

function BookingRow({ booking, onCancel, cancelling }) {
  const [confirming, setConfirming] = useState(false);
  const group = groupOf(booking);
  const event = booking.event ?? {};
  return (
    <motion.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="surface overflow-hidden">
      <div className="grid gap-5 p-4 sm:grid-cols-[132px_1fr_auto] sm:items-center sm:p-5">
        <Link to={`/bookings/${booking.reference}`} className="block overflow-hidden rounded-xl">
          <img src={imageSized(event.image, 400)} alt="" className={cn('aspect-[4/3] w-full object-cover sm:aspect-square', group !== 'upcoming' && 'grayscale')} />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={group === 'cancelled' ? 'danger' : group === 'past' ? 'neutral' : 'success'}>{group === 'cancelled' ? 'Cancelled' : group === 'past' ? 'Attended' : 'Confirmed'}</Badge>
            <span className="font-mono text-xs text-subtle">{booking.reference}</span>
          </div>
          <Link to={`/bookings/${booking.reference}`} className="mt-2 block text-lg font-semibold leading-snug hover:text-accent">
            {event.title}
          </Link>
          <p className="mt-1 text-sm text-subtle">
            {formatMediumDate(event.startsAt)} · {formatTime(event.startsAt)} · {event.venue?.name}, {event.venue?.city}
          </p>
          <p className="mt-1 text-sm text-subtle">
            {booking.seats} seat{booking.seats > 1 ? 's' : ''} · {formatPrice(booking.total)} · {booking.attendee?.name}
          </p>
          {group === 'upcoming' && (
            <p className="mt-2 text-xs text-subtle">
              Starts in <Countdown target={event.startsAt} compact className="font-semibold text-text" />
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
          <ButtonLink to={`/bookings/${booking.reference}`} size="sm" variant="inverse">
            <Ticket className="size-4" /> View pass
          </ButtonLink>
          {group === 'upcoming' && (
            <>
              <Button size="sm" variant="outline" onClick={() => addToCalendar(event, booking.reference)}>
                <CalendarPlus className="size-4" /> Calendar
              </Button>
              {confirming ? (
                <div className="flex gap-1">
                  <Button size="sm" variant="danger" loading={cancelling} onClick={() => onCancel(booking)}>
                    Confirm
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} aria-label="Keep booking">
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="danger" onClick={() => setConfirming(true)}>
                  Cancel
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.li>
  );
}

export default function Bookings() {
  const bookings = useLocalBookings();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('upcoming');
  const [syncing, setSyncing] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [clearArmed, setClearArmed] = useState(false);
  const fileInput = useRef(null);

  const sync = useCallback(
    async (announce = false) => {
      setSyncing(true);
      try {
        const references = bookingsStore.getSnapshot().map((b) => b.reference);
        const [local, mine] = await Promise.all([
          references.length ? api.lookupBookings(references.slice(0, 100)) : { items: [] },
          user ? api.myBookings() : { items: [] },
        ]);
        bookingsStore.merge([...local.items, ...mine.items]);
        if (announce) toast.success('Bookings are up to date');
      } catch (err) {
        if (announce) toast.error(err.message);
      } finally {
        setSyncing(false);
      }
    },
    [user],
  );

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    if (!clearArmed) return undefined;
    const id = setTimeout(() => setClearArmed(false), 4000);
    return () => clearTimeout(id);
  }, [clearArmed]);

  const cancel = async (booking) => {
    setCancelling(booking.reference);
    try {
      const { booking: updated } = await api.cancelBooking(booking.reference, booking.attendee?.email);
      bookingsStore.merge([updated]);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      toast.success('Booking cancelled — your seats were released');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(null);
    }
  };

  const importFile = async (file) => {
    try {
      const list = parseBackup(await file.text());
      bookingsStore.merge(list);
      toast.success(`Imported ${list.length} booking${list.length === 1 ? '' : 's'}`);
      sync();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const stamp = new Date().toISOString().slice(0, 10);
  const groups = { upcoming: [], past: [], cancelled: [] };
  bookings.forEach((b) => groups[groupOf(b)].push(b));
  groups.upcoming.sort((a, b) => new Date(a.event?.startsAt) - new Date(b.event?.startsAt));

  return (
    <>
      <title>My bookings · EventSphere</title>
      <section className="border-b border-line bg-panel">
        <div className="shell flex flex-col gap-6 py-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Your account</p>
            <h1 className="display mt-3 text-5xl sm:text-6xl">My bookings</h1>
            <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-subtle">
              <span className="inline-flex items-center gap-1.5"><HardDrive className="size-4" /> Saved in this browser’s Local Storage</span>
              {user ? (
                <span className="inline-flex items-center gap-1.5 text-success"><Cloud className="size-4" /> Synced with {user.email}</span>
              ) : (
                <span>· Sign in with Google to sync across devices</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => sync(true)} loading={syncing}>
              {!syncing && <RefreshCw className="size-4" />} Refresh
            </Button>
            <Button variant="outline" size="sm" disabled={!bookings.length} onClick={() => download(`eventsphere-bookings-${stamp}.csv`, toCsv(bookings), 'text/csv')}>
              <Download className="size-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" disabled={!bookings.length} onClick={() => download(`eventsphere-bookings-${stamp}.json`, JSON.stringify({ app: 'eventsphere', exportedAt: new Date().toISOString(), bookings }, null, 2), 'application/json')}>
              <FileJson className="size-4" /> JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <Upload className="size-4" /> Import
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importFile(file);
                e.target.value = '';
              }}
            />
            <Button
              variant="danger"
              size="sm"
              disabled={!bookings.length}
              onClick={() => {
                if (!clearArmed) return setClearArmed(true);
                bookingsStore.clear();
                setClearArmed(false);
                toast('Removed from this device. Your bookings remain confirmed on our servers.');
              }}
            >
              <Trash2 className="size-4" /> {clearArmed ? 'Click again to clear' : 'Clear device'}
            </Button>
          </div>
        </div>
      </section>

      <section className="shell py-10">
        <div role="tablist" aria-label="Booking status" className="flex gap-6 border-b border-line">
          {TABS.map(([key, label]) => (
            <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={cn('relative pb-3 text-sm font-medium', tab === key ? 'text-text' : 'text-subtle hover:text-text')}>
              {label} <span className="ml-1 font-mono text-xs text-subtle">{groups[key].length}</span>
              {tab === key && <motion.span layoutId="bookings-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-lavender" />}
            </button>
          ))}
        </div>
        <div className="mt-8">
          {groups[tab].length === 0 ? (
            <EmptyState icon={Ticket} title={tab === 'upcoming' ? 'No upcoming bookings' : `No ${tab} bookings`} action={<ButtonLink to="/events">Browse events</ButtonLink>}>
              {tab === 'upcoming' ? 'When you book an event, your pass appears here — even offline.' : 'Nothing to show here yet.'}
            </EmptyState>
          ) : (
            <ul className="space-y-4">
              <AnimatePresence initial={false}>
                {groups[tab].map((b) => (
                  <BookingRow key={b.reference} booking={b} onCancel={cancel} cancelling={cancelling === b.reference} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
