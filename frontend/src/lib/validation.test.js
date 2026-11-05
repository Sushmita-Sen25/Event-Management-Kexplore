import { describe, expect, it } from 'vitest';
import { checks, formatPhone, normalisePhone, STEP_FIELDS, validate } from './validation';
import { parseBackup, toCsv } from './bookings-store';

const valid = { eventId: 'abc', name: 'Sushmita Sen', email: 'sushmita@example.com', phone: '98765 43210', city: 'Kolkata', seats: 2, terms: true };

describe('checkout validation', () => {
  it('passes a complete form on every step', () => {
    STEP_FIELDS.forEach((fields) => expect(validate(valid, fields, { available: 10 })).toEqual({}));
  });

  it('flags every missing detail on step one', () => {
    expect(Object.keys(validate({}, STEP_FIELDS[0])).sort()).toEqual(['email', 'eventId', 'name', 'phone']);
  });

  it.each([
    ['Al', 'at least 3'],
    ['R2D2', 'letters only'],
    ['x'.repeat(61), '60 characters'],
  ])('rejects the name %j', (name, message) => expect(checks.name(name)).toContain(message));

  it('accepts names with Indian scripts, dots and hyphens', () => {
    expect(checks.name('सुष्मिता सेन')).toBe('');
    expect(checks.name("A. D'Souza-Rao")).toBe('');
  });

  it.each(['plain', 'a@b', 'a b@c.com', 'a@b..com'])('rejects the email %j', (email) => expect(checks.email(email)).not.toBe(''));

  it('understands Indian mobile number formats', () => {
    expect(normalisePhone('+91 98765-43210')).toBe('9876543210');
    expect(normalisePhone('09876543210')).toBe('9876543210');
    expect(checks.phone('+91 98765 43210')).toBe('');
    expect(checks.phone('12345 67890')).toContain('start with 6');
    expect(checks.phone('98765')).toContain('10 digits');
    expect(formatPhone('9876543210')).toBe('98765 43210');
  });

  it('caps seats by the booking limit and by availability', () => {
    expect(checks.seats(0)).not.toBe('');
    expect(checks.seats(7)).toContain('up to 6');
    expect(checks.seats(3, 2)).toContain('Only 2');
    expect(checks.seats(2, 2)).toBe('');
  });

  it('requires the terms checkbox', () => expect(checks.terms(false)).not.toBe(''));
});

describe('Local Storage backups', () => {
  const booking = {
    reference: 'ES-7K2Q9X',
    status: 'confirmed',
    seats: 2,
    total: 1598,
    attendee: { name: 'Ria "RJ" Das', email: 'ria@example.com', phone: '+919876543210' },
    event: { title: 'UI/UX Design Bootcamp', startsAt: '2026-11-15T04:30:00Z', venue: { name: 'WeWork Galaxy', city: 'Bengaluru' } },
    createdAt: '2026-11-06T10:00:00Z',
  };

  it('exports CSV with quotes escaped', () => {
    const csv = toCsv([booking]);
    expect(csv.split('\n')[0]).toContain('reference');
    expect(csv).toContain('"Ria ""RJ"" Das"');
  });

  it('imports only well-formed bookings', () => {
    const file = JSON.stringify({ bookings: [booking, { reference: 'nope' }, { reference: 'ES-AAAAAA' }] });
    expect(parseBackup(file)).toHaveLength(1);
    expect(() => parseBackup('{"x":1}')).toThrow(/backup/);
  });
});
