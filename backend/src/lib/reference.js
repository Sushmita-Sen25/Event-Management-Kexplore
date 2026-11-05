import { randomInt } from 'node:crypto';

// Unambiguous characters only (no 0/O, 1/I/L) so references are easy to read at the door.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Booking reference such as "ES-7K2Q9X". */
export const bookingReference = () =>
  `ES-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')}`;

export const toSlug = (text) =>
  String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
