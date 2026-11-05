import { Link } from 'react-router';

const UPDATED = '6 November 2026';
const REPO = 'https://github.com/Sushmita-Sen25/Event_mangement_website';

const PAGES = {
  privacy: {
    title: 'Privacy Policy',
    intro:
      'EventSphere is a student web-design project for discovering and booking sample events. This policy explains what information the website uses, where it is kept and the choices you have.',
    sections: [
      {
        h: '1. Information we use',
        list: [
          'Booking details: the name, email address, mobile number, optional city and number of seats you enter at checkout.',
          'Google account details: if you choose Sign in with Google, Google shares your name, email address and profile picture. We request nothing else.',
          'Newsletter: the email address and interests you submit in the footer form.',
          'Preferences: your light/dark theme choice, kept only in your browser.',
        ],
      },
      {
        h: '2. Where your information is stored',
        text: 'Bookings are stored in our database (MongoDB Atlas) so seat counts stay accurate and you can view your bookings on any device after signing in. A copy of each booking is also kept in your browser’s Local Storage so your pass opens offline. We never sell or share your information.',
      },
      {
        h: '3. Third-party services',
        list: [
          'Google Identity Services — Sign in with Google.',
          'Vercel and Render — host the website and its API.',
          'MongoDB Atlas — stores events, bookings and newsletter sign-ups.',
          'Unsplash and OpenStreetMap — event images and venue maps.',
        ],
      },
      {
        h: '4. Cookies',
        text: 'When you sign in we set one secure, HTTP-only cookie (es_session) that keeps you signed in for 14 days. Signing out removes it. Google may set its own cookies on its own domains.',
      },
      {
        h: '5. Your choices',
        list: [
          'Cancel any booking from My Bookings — your seats are released immediately.',
          'Export or clear the bookings stored in your browser from My Bookings.',
          'Sign out at any time from the account menu.',
          'Remove EventSphere’s access to your Google account at myaccount.google.com/connections.',
        ],
      },
      { h: '6. Children', text: 'EventSphere is not directed at children under 13.' },
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro: 'By using EventSphere you agree to these terms. If you do not agree, please do not use the website.',
    sections: [
      {
        h: '1. About EventSphere',
        text: 'EventSphere is a student web-design project built for demonstration. Events, prices, venues and seat counts are sample data. A booking reserves a seat in our demo system only — it is not a real ticket, and no payment is processed.',
      },
      {
        h: '2. Bookings',
        list: [
          'One booking per email address per event, up to six seats per booking.',
          'Enter only information that belongs to you.',
          'You can cancel a booking at any time from My Bookings.',
        ],
      },
      { h: '3. Your account', text: 'Signing in with Google is optional. You are responsible for activity while you are signed in on your device.' },
      { h: '4. Acceptable use', text: 'Do not try to break, overload or misuse the website or its API.' },
      { h: '5. Content', text: 'Event images are provided by Unsplash under the Unsplash License. Venue names are used only to make the sample events realistic.' },
      { h: '6. No warranty and liability', text: 'The website is provided “as is”, without warranties of any kind. To the extent allowed by law, the EventSphere authors are not liable for any loss arising from its use.' },
    ],
  },
};

export default function Legal({ page }) {
  const content = PAGES[page];
  const other = page === 'privacy' ? ['terms', 'Terms of Service'] : ['privacy', 'Privacy Policy'];
  return (
    <>
      <title>{`${content.title} · EventSphere`}</title>
      <article className="shell max-w-3xl py-14">
        <p className="eyebrow">Legal</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">{content.title}</h1>
        <p className="mt-3 text-sm text-subtle">Last updated {UPDATED}</p>
        <p className="mt-8 text-lg text-text/85">{content.intro}</p>
        {content.sections.map((s) => (
          <section key={s.h} className="mt-10">
            <h2 className="text-xl font-semibold">{s.h}</h2>
            {s.text && <p className="mt-3 text-subtle">{s.text}</p>}
            {s.list && (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-subtle marker:text-accent">
                {s.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <p className="mt-12 border-t border-line pt-6 text-sm text-subtle">
          Questions? Open an issue on the{' '}
          <a href={REPO} target="_blank" rel="noreferrer" className="text-accent underline">
            GitHub repository
          </a>
          . See also our <Link to={`/${other[0]}`} className="text-accent underline">{other[1]}</Link>.
        </p>
      </article>
    </>
  );
}
