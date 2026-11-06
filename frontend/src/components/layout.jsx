import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { ReactLenis, useLenis } from 'lenis/react';
import { LogOut, Menu, Moon, Sun, Ticket } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { toast } from 'sonner';
import { useLocalBookings } from '@/hooks/data';
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
          <span className="grid size-7 place-items-center rounded-full bg-cta text-xs font-semibold text-on-cta">{user.name[0]}</span>
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
      toast.success(alreadySubscribed ? 'You’re already subscribed. Your interests have been updated.' : 'Subscribed. Your first email arrives on Friday.');
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
      <p className="mt-5 text-xs text-subtle">Interests (optional)</p>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[13px]" role="group" aria-label="Interests (optional)">
        {CATEGORIES.map(({ name }) => {
          const on = interests.includes(name);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              onClick={() => setInterests((list) => (on ? list.filter((n) => n !== name) : [...list, name]))}
              className={cn('rounded-full border px-3 py-1 transition-colors', on ? 'border-text bg-text text-canvas' : 'border-line text-subtle hover:border-line-strong hover:text-text')}
            >
              {name}
            </button>
          );
        })}
      </div>
    </form>
  );
}

const FOOTER_LINKS = [
  ['Explore', [['All events', '/events'], ['This week', '/events?when=week'], ['Free events', '/events?price=free'], ['Past events', '/events?when=past']]],
  ['Bookings', [['My bookings', '/bookings'], ['Calendar view', '/events?view=list']]],
  ['About', [['Privacy policy', '/privacy'], ['Terms of service', '/terms'], ['Source code', 'https://github.com/Sushmita-Sen25/Event-Management-Kexplore']]],
];

function Footer() {
  return (
    <footer className="mt-32 border-t border-line">
      <div className="shell grid gap-14 py-16 lg:grid-cols-[1.15fr_1fr]">
        <div className="max-w-md">
          <Logo />
          <h2 className="mt-8 font-semibold">The weekly lineup</h2>
          <p className="mt-1.5 text-sm text-subtle">New events in your city, every Friday. Unsubscribe from any email.</p>
          <div className="mt-5">
            <Newsletter />
          </div>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {FOOTER_LINKS.map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-sm font-medium">{heading}</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-subtle">
                {links.map(([label, to]) => (
                  <li key={label}>
                    {to.startsWith('http') ? (
                      <a href={to} target="_blank" rel="noreferrer" className="hover:text-text">
                        {label}
                      </a>
                    ) : (
                      <Link to={to} className="hover:text-text">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-6 text-xs text-subtle sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Eventique. A K Explore web design project.</p>
          <p>All times are Indian Standard Time.</p>
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
      <span className="size-8 animate-spin rounded-full border-2 border-line border-t-hot" />
    </div>
  );
}

export function RootLayout() {
  const { googleReady } = useSession();
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <ReactLenis root options={{ lerp: 0.12, smoothWheel: !reduced }}>
      <a href="#content" className="sr-only z-[100] rounded-lg bg-cta px-4 py-2 text-on-cta focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
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
