import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { api } from '@/lib/api';
import { bookingsStore } from '@/lib/bookings-store';

export const useEvents = (params) =>
  useQuery({
    queryKey: ['events', params],
    queryFn: ({ signal }) => api.events(params, signal),
    placeholderData: keepPreviousData,
  });

export const useFacets = () => useQuery({ queryKey: ['facets'], queryFn: api.facets, staleTime: 5 * 60_000 });

export const useEvent = (slug) => useQuery({ queryKey: ['event', slug], queryFn: () => api.event(slug), enabled: Boolean(slug) });

export const useLocalBookings = () => useSyncExternalStore(bookingsStore.subscribe, bookingsStore.getSnapshot, () => []);

/** Ticking countdown to `target` (updates every second until it passes). */
export function useCountdown(target) {
  const end = target ? new Date(target).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!end || end <= Date.now()) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [end]);
  const left = Math.max(0, end - now);
  return {
    done: left === 0,
    days: Math.floor(left / 86_400_000),
    hours: Math.floor(left / 3_600_000) % 24,
    minutes: Math.floor(left / 60_000) % 60,
    seconds: Math.floor(left / 1000) % 60,
  };
}

export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
