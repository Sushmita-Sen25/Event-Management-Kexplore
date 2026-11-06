import { ArrowLeft, Compass } from 'lucide-react';
import { BrowseButton } from '@/components/specular';
import { ButtonLink } from '@/components/ui';

export default function NotFound({ title = 'Page not found' }) {
  return (
    <section>
      <div className="shell grid min-h-[70vh] place-items-center py-20 text-center">
        <title>Page not found · Eventique</title>
        <div>
          <p className="text-sm text-subtle">Error 404</p>
          <h1 className="display mt-4 text-5xl sm:text-7xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-md text-subtle">The link may be broken or the event may have been removed. Let’s get you back to something good.</p>
          <div className="mt-8 flex justify-center gap-3">
            <BrowseButton size="md">
              <Compass className="size-4" aria-hidden />
            </BrowseButton>
            <ButtonLink to="/" variant="outline">
              <ArrowLeft className="size-4" /> Home
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
