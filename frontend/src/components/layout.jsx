import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { ReactLenis, useLenis } from 'lenis/react';
import { ArrowRight, LogOut, Menu, Moon, Sun, Ticket } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { toast } from 'sonner';
import { useFacets, useLocalBookings } from '@/hooks/data';
import { useSession } from '@/hooks/session';
import { useTheme } from '@/hooks/theme';
import { api } from '@/lib/api';
import { checks } from '@/lib/validation';
import { CATEGORIES, cn } from '@/lib/misc';
import { Glass, GlassPill } from './glass';
import { BrowseButton } from './specular';
import { Button, Logo, Sheet, TextInput } from './ui';

const NAV = [
  { to: '/', label: 'Discover', end: true },
  { to: '/events', label: 'Events' },
  { to: '/bookings', label: 'My bookings' },
];

function AnnouncementBar() {
  const { data } = useFacets();
  return (
    <div className="bg-gradient-to-r from-wine via-plum to-dusk text-white">
      <div className="shell flex h-9 items-center justify-center gap-2 text-xs sm:text-[13px]">
        <span className="size-1.5 animate-pulse-dot rounded-full bg-white" aria-hidden />
        <span className="truncate">
          New season: {data ? `${data.totals.events} events across ${data.totals.cities} cities` : 'events across India'}
        </span>
        <Link to="/events" className="hidden items-center gap-1 font-medium underline-offset-4 hover:underline sm:inline-flex">
          See the calendar <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} title="Toggle theme">
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </Button>
  );
}

function Account() {
  const { user, loading, signIn, signOut, googleReady } = useSession();
  const { dark } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  if (loading) return <span className="skeleton size-9 rounded-full" />;
  if (!user) {
    if (!googleReady) return null;
    return (
      // color-scheme: light stops Chrome painting an opaque white box behind Google's iframe in dark mode.
      <div className="h-10 overflow-hidden [color-scheme:light]" key={dark ? 'd' : 'l'}>
        <GoogleLogin
          onSuccess={(r) => signIn(r.credential)}
          onError={() => toast.error('Google sign-in was cancelled')}
          theme={dark ? 'filled_black' : 'outline'}
          shape="pill"
          text="signin"
          size="large"
        />
      </div>
    );
  }
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Account menu" className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 transition hover:border-line-strong">
        {user.picture ? (
          <img src={user.picture} alt="" referrerPolicy="no-referrer" className="size-7 rounded-full" />
        ) : (
          <span className="grid size-7 place-items-center rounded-full bg-cta text-xs font-semibold text-white">{user.name[0]}</span>
        )}
        <span className="hidden max-w-28 truncate text-sm font-medium md:block">{user.name.split(' ')[0]}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 mt-2 w-64 rounded-2xl border border-line bg-raised p-2 shadow-2xl shadow-ink/30"
          >
            <div className="border-b border-line px-3 py-2.5">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-subtle">{user.email}</p>
            </div>
            <Link to="/bookings" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-accent-soft">
              <Ticket className="size-4 text-subtle" /> My bookings
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bookings = useLocalBookings();
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && new Date(b.event?.endsAt) > new Date()).length;
  const { pathname } = useLocation();

  const { dark } = useTheme();

  useLenis(({ scroll }) => setScrolled(scroll > 8));
  useEffect(() => setMenu(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 pt-3">
      <div className="shell">
        <Glass radius={22} frost={scrolled ? (dark ? 0.62 : 0.68) : dark ? 0.32 : 0.45} className="flex h-16 items-center gap-6 pl-5 pr-2.5">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="relative rounded-[14px] px-3.5 py-2 text-sm">
                {({ isActive }) => (
                  <>
                    {isActive && <GlassPill layoutId="nav-pill" />}
                    <span className={cn('relative transition-colors', isActive ? 'font-medium text-text' : 'text-subtle hover:text-text')}>
                      {item.label}
                      {item.to === '/bookings' && upcoming > 0 && (
                        <span className="ml-1.5 rounded-md bg-accent-soft px-1.5 py-0.5 font-mono text-[11px] text-accent">{upcoming}</span>
                      )}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden sm:block">
              <Account />
            </div>
            <BrowseButton className="hidden lg:inline-flex" />
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </div>
        </Glass>
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title="Menu">
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn('rounded-xl px-4 py-3 text-lg', isActive ? 'bg-accent-soft text-accent' : 'hover:bg-accent-soft')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 border-t border-line pt-6">
          <Account />
        </div>
      </Sheet>
    </header>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState([]);
  const [error, setError] = useState('');
  const subscribe = useMutation({
    mutationFn: () => api.subscribe(email.trim(), interests),
    onSuccess: ({ alreadySubscribed }) => {
      toast.success(alreadySubscribed ? 'You’re already on the list — interests updated.' : 'Subscribed! The weekly lineup lands every Friday.');
      setEmail('');
    },
    onError: (err) => setError(err.fields?.email ?? err.message),
  });
  const submit = (e) => {
    e.preventDefault();
    const message = checks.email(email);
    setError(message);
    if (!message) subscribe.mutate();
  };
  return (
    <form onSubmit={submit} noValidate className="w-full max-w-xl">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <TextInput
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          placeholder="you@example.com"
          invalid={Boolean(error)}
          aria-describedby={error ? 'newsletter-error' : undefined}
        />
        <Button type="submit" loading={subscribe.isPending}>
          Subscribe
        </Button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Interests">
        {CATEGORIES.map(({ name }) => {
          const on = interests.includes(name);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              onClick={() => setInterests((list) => (on ? list.filter((n) => n !== name) : [...list, name]))}
              className={cn('rounded-lg border px-2.5 py-1 text-xs transition', on ? 'border-lavender bg-accent-soft text-accent' : 'border-line text-subtle hover:border-line-strong')}
            >
              {name}
            </button>
          );
        })}
      </div>
    </form>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-panel">
      <div className="shell grid gap-12 py-16 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow">The weekly lineup</p>
          <h2 className="display mt-3 text-4xl">Never miss a night worth remembering.</h2>
          <p className="mt-3 max-w-md text-subtle">One email every Friday with the best events near you. Pick what you’re into.</p>
          <div className="mt-6">
            <Newsletter />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-4 text-sm font-semibold">Explore</h3>
            <ul className="space-y-2.5 text-sm text-subtle">
              {CATEGORIES.slice(0, 5).map((c) => (
                <li key={c.name}>
                  <Link to={`/events?category=${c.name}`} className="hover:text-text">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Your account</h3>
            <ul className="space-y-2.5 text-sm text-subtle">
              <li><Link to="/bookings" className="hover:text-text">My bookings</Link></li>
              <li><Link to="/events?when=week" className="hover:text-text">This week</Link></li>
              <li><Link to="/events?price=free" className="hover:text-text">Free events</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Company</h3>
            <ul className="space-y-2.5 text-sm text-subtle">
              <li><Link to="/privacy" className="hover:text-text">Privacy policy</Link></li>
              <li><Link to="/terms" className="hover:text-text">Terms of service</Link></li>
              <li>
                <a href="https://github.com/Sushmita-Sen25/Event_mangement_website" target="_blank" rel="noreferrer" className="hover:text-text">
                  Source code
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="shell flex flex-col items-center justify-between gap-3 py-6 text-xs text-subtle sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} EventSphere · K Explore Web Designing · All times in IST</p>
        </div>
      </div>
    </footer>
  );
}

function OneTap() {
  const { user, loading, signIn } = useSession();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 4000);
    return () => clearTimeout(id);
  }, []);
  useGoogleOneTapLogin({
    onSuccess: (r) => signIn(r.credential),
    onError: () => {},
    disabled: !ready || loading || Boolean(user),
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: true,
  });
  return null;
}

function ScrollReset() {
  const { pathname } = useLocation();
  const lenis = useLenis();
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, [pathname, lenis]);
  return null;
}

export function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading">
      <span className="size-8 animate-spin rounded-full border-2 border-line border-t-lavender" />
    </div>
  );
}

export function RootLayout() {
  const { googleReady } = useSession();
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <ReactLenis root options={{ lerp: 0.12, smoothWheel: !reduced }}>
      <a href="#content" className="sr-only z-[100] rounded-lg bg-cta px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="content" className="min-h-[70vh]">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ScrollReset />
      {googleReady && <OneTap />}
    </ReactLenis>
  );
}
