import { clsx } from 'clsx';
import { createElement } from 'react';
import { Briefcase, Dumbbell, Laptop, Music, Palette, PenTool, UtensilsCrossed } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { download } from './bookings-store';

export const cn = (...classes) => twMerge(clsx(classes));

export const CATEGORIES = [
  { name: 'Music', icon: Music, blurb: 'Festivals, gigs and classical evenings' },
  { name: 'Technology', icon: Laptop, blurb: 'Summits, conferences and meetups' },
  { name: 'Workshop', icon: PenTool, blurb: 'Hands-on bootcamps and masterclasses' },
  { name: 'Business', icon: Briefcase, blurb: 'Pitch nights and leadership forums' },
  { name: 'Sports', icon: Dumbbell, blurb: 'Marathons and cycling challenges' },
  { name: 'Food', icon: UtensilsCrossed, blurb: 'Carnivals and chef’s tables' },
  { name: 'Art', icon: Palette, blurb: 'Exhibitions, film and culture' },
];
export const categoryIcon = (name) => CATEGORIES.find((c) => c.name === name)?.icon ?? Music;

/** Renders the icon for a category name, e.g. <CategoryIcon name="Music" className="size-4" />. */
export const CategoryIcon = ({ name, ...props }) => createElement(categoryIcon(name), props);

export const WHEN = [
  { value: 'upcoming', label: 'All upcoming' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'month', label: 'Next 30 days' },
  { value: 'quarter', label: 'Next 3 months' },
  { value: 'past', label: 'Past events' },
];

export const PRICES = [
  { value: '', label: 'Any price' },
  { value: 'free', label: 'Free' },
  { value: 'under-1000', label: 'Under ₹1,000' },
  { value: '1000-2500', label: '₹1,000 – ₹2,500' },
  { value: 'over-2500', label: 'Over ₹2,500' },
];

export const SORTS = [
  { value: 'soonest', label: 'Date: soonest' },
  { value: 'popular', label: 'Most booked' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

export const FAQS = [
  { q: 'Do I need an account to book?', a: 'No. Enter your name, email and mobile number and your pass is ready straight away. Signing in with Google fills in your details and keeps your bookings in sync across devices.' },
  { q: 'Where are my tickets stored?', a: 'Every booking is saved in this browser’s Local Storage, so tickets open offline. They are also stored securely on our servers, and you can export them as CSV or JSON from My Bookings.' },
  { q: 'Can I cancel a booking?', a: 'Yes. Open My Bookings and press and hold Hold to cancel on the booking. Your seats are released straight away so someone else can take them.' },
  { q: 'How many seats can I book?', a: 'Up to six seats per booking, as long as the event still has space. One booking per email address per event.' },
  { q: 'Is payment taken online?', a: 'Not in this version. Your booking reserves the seats and the amount shown is paid at the venue.' },
  { q: 'What do I show at the entrance?', a: 'The QR pass on your booking page, either on your phone or printed. The booking reference works too.' },
];

const icsStamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s = '') => String(s).replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');

/** Download an .ics calendar file (Google, Apple and Outlook calendars all read it). */
export function addToCalendar(event, reference) {
  const url = `${window.location.origin}/events/${event.slug}`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eventique//Bookings//EN',
    'BEGIN:VEVENT',
    `UID:${reference ?? event.slug}@eventique`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(event.startsAt)}`,
    `DTEND:${icsStamp(event.endsAt)}`,
    `SUMMARY:${icsText(event.title)}`,
    `LOCATION:${icsText(`${event.venue?.name}, ${event.venue?.city}`)}`,
    `DESCRIPTION:${icsText(`${reference ? `Booking ${reference}\n` : ''}${url}`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT3H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(event.title)} starts in 3 hours`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  download(`${event.slug}.ics`, ics, 'text/calendar');
}
