import { ArrowLeft, Compass } from 'lucide-react';
import { ButtonLink } from '@/components/ui';

export default function NotFound({ title = 'This page took a wrong turn' }) {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="glow-field absolute inset-0 -z-10" />
      <div className="shell grid min-h-[70vh] place-items-center py-20 text-center">
        <title>Page not found · EventSphere</title>
        <div>
          <p className="font-mono text-sm tracking-[0.3em] text-accent">404</p>
          <h1 className="display mt-4 text-5xl sm:text-7xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-md text-subtle">The link may be broken or the event may have been removed. Let’s get you back to something good.</p>
          <div className="mt-8 flex justify-center gap-3">
            <ButtonLink to="/events">
              <Compass className="size-4" /> Browse events
            </ButtonLink>
            <ButtonLink to="/" variant="outline">
              <ArrowLeft className="size-4" /> Home
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
