import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy } from 'react';
import { createBrowserRouter, Link, RouterProvider, useRouteError } from 'react-router';
import { Toaster } from 'sonner';
import { RootLayout } from './components/layout';
import { GOOGLE_CLIENT_ID, SessionProvider } from './hooks/session';
import { ThemeProvider, useTheme } from './hooks/theme';
import Home from './pages/Home';

const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Bookings = lazy(() => import('./pages/Bookings'));
const BookingDetail = lazy(() => import('./pages/BookingDetail'));
const Legal = lazy(() => import('./pages/Legal'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retry network errors and 5xx (the free API may be waking up), never 4xx.
      retry: (attempt, error) => (error?.status === 0 || error?.status >= 500) && attempt < 4,
      retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 10_000),
    },
  },
});

function CrashScreen() {
  const error = useRouteError();
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6 text-center text-text">
      <div>
        <p className="eyebrow">Something broke</p>
        <h1 className="display mt-3 text-5xl">That wasn’t supposed to happen.</h1>
        <p className="mt-3 text-subtle">{error?.message ?? 'Unknown error'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => window.location.reload()} className="h-11 rounded-xl bg-cta px-5 text-on-cta">
            Reload
          </button>
          <Link to="/" reloadDocument className="grid h-11 place-items-center rounded-xl border border-line px-5">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <CrashScreen />,
    children: [
      { index: true, element: <Home /> },
      { path: 'events', element: <Events /> },
      { path: 'events/:slug', element: <EventDetail /> },
      { path: 'checkout/:slug', element: <Checkout /> },
      { path: 'bookings', element: <Bookings /> },
      { path: 'bookings/:reference', element: <BookingDetail /> },
      { path: 'privacy', element: <Legal page="privacy" /> },
      { path: 'terms', element: <Legal page="terms" /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="bottom-center" richColors closeButton />;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || 'missing-client-id'}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SessionProvider>
            <RouterProvider router={router} />
            <ThemedToaster />
          </SessionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
