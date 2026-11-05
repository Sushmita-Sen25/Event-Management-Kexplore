import { googleLogout } from '@react-oauth/google';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { bookingsStore } from '@/lib/bookings-store';

const SessionContext = createContext(null);
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export function SessionProvider({ children }) {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: ['session'], queryFn: api.session, staleTime: 5 * 60_000, retry: 1 });

  const signIn = useMutation({
    mutationFn: api.signInWithGoogle,
    onSuccess: async ({ user }) => {
      queryClient.setQueryData(['session'], { user });
      toast.success(`Signed in as ${user.name}`);
      try {
        const { items } = await api.myBookings();
        bookingsStore.merge(items);
      } catch {
        /* not critical */
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const signOut = useCallback(async () => {
    await api.signOut().catch(() => {});
    googleLogout();
    queryClient.setQueryData(['session'], { user: null });
    toast('Signed out. Your bookings stay on this device.');
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: data?.user ?? null,
      loading: isPending,
      signIn: (credential) => signIn.mutate(credential),
      signingIn: signIn.isPending,
      signOut,
      googleReady: Boolean(GOOGLE_CLIENT_ID),
    }),
    [data, isPending, signIn, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
