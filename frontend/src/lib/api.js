/**
 * Small fetch client for the EventSphere API.
 * Requests go to the same origin (`/api`): Vite proxies it locally and Vercel rewrites it to
 * Render in production, which keeps the session cookie first-party.
 */
export class ApiError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'We couldn’t reach EventSphere. Check your connection and try again.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fallback = response.status >= 500 ? 'The server is starting up. Please try again in a few seconds.' : 'Something went wrong';
    throw new ApiError(response.status, data.message || fallback, data.fields);
  }
  return data;
}

const query = (params) => {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && !value.length)) {
      search.set(key, Array.isArray(value) ? value.join(',') : value);
    }
  });
  const text = search.toString();
  return text ? `?${text}` : '';
};

export const api = {
  events: (params, signal) => request(`/events${query(params)}`, { signal }),
  facets: () => request('/events/facets'),
  event: (slug) => request(`/events/${encodeURIComponent(slug)}`),

  book: (body) => request('/bookings', { method: 'POST', body }),
  booking: (reference) => request(`/bookings/${encodeURIComponent(reference)}`),
  myBookings: () => request('/bookings/mine'),
  lookupBookings: (references) => request('/bookings/lookup', { method: 'POST', body: { references } }),
  cancelBooking: (reference, email) => request(`/bookings/${reference}/cancel`, { method: 'POST', body: { email } }),

  session: () => request('/auth/session'),
  signInWithGoogle: (credential) => request('/auth/google', { method: 'POST', body: { credential } }),
  signOut: () => request('/auth/signout', { method: 'POST' }),

  subscribe: (email, interests) => request('/newsletter', { method: 'POST', body: { email, interests } }),
};
