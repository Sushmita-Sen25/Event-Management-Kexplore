/**
 * Checkout form validation — plain functions so they are easy to unit test.
 * The API validates the same rules again on the server.
 */
export const MAX_SEATS = 6;

// \p{M} allows combining marks such as the vowel signs used in Hindi, Bengali, Tamil and other Indian scripts.
const NAME = /^[\p{L}][\p{L}\p{M}\s.'-]+$/u;
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Keep only digits and drop a leading +91 / 91 / 0 so we are left with the 10-digit number. */
export function normalisePhone(value = '') {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

/** "9876543210" → "98765 43210" while typing. */
export function formatPhone(value = '') {
  const digits = normalisePhone(value).slice(0, 10);
  return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
}

export const checks = {
  eventId: (v) => (v ? '' : 'Choose the event you want to attend'),
  name(v = '') {
    const value = v.trim();
    if (!value) return 'Enter your full name';
    if (value.length < 3) return 'Name must be at least 3 characters';
    if (value.length > 60) return 'Name must be 60 characters or fewer';
    if (!NAME.test(value)) return 'Use letters only — spaces, dots, apostrophes and hyphens are fine';
    return '';
  },
  email(v = '') {
    const value = v.trim();
    if (!value) return 'Enter your email address';
    if (/\s/.test(value)) return 'Email addresses can’t contain spaces';
    if (!EMAIL.test(value) || value.includes('..')) return 'Enter a valid email, e.g. name@example.com';
    return '';
  },
  phone(v = '') {
    const digits = normalisePhone(v);
    if (!digits) return 'Enter your mobile number';
    if (digits.length !== 10) return 'Mobile numbers have 10 digits';
    if (!/^[6-9]/.test(digits)) return 'Indian mobile numbers start with 6, 7, 8 or 9';
    return '';
  },
  city: (v = '') => (v.trim().length > 60 ? 'Keep the city under 60 characters' : ''),
  seats(v, available = MAX_SEATS) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1) return 'Choose at least one seat';
    if (n > Math.min(MAX_SEATS, available)) return available < MAX_SEATS ? `Only ${available} seats are left` : `You can book up to ${MAX_SEATS} seats`;
    return '';
  },
  terms: (v) => (v ? '' : 'Please accept the booking terms'),
};

/** Fields validated on each checkout step. */
export const STEP_FIELDS = [['eventId', 'name', 'email', 'phone', 'city'], ['seats'], ['terms']];

export function validate(values, fields, { available } = {}) {
  const errors = {};
  for (const field of fields) {
    const message = field === 'seats' ? checks.seats(values.seats, available) : checks[field](values[field]);
    if (message) errors[field] = message;
  }
  return errors;
}
