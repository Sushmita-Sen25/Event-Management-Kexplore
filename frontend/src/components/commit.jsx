import { XCircle } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import HoldButton from '@/components/HoldButton';
import SlideCommit from '@/components/SlideCommit';
import { useTheme } from '@/hooks/theme';
import { cn } from '@/lib/misc';

const HEIGHT = 56;

/**
 * React Bits <SlideCommit> as the checkout's "confirm booking" control.
 * SlideCommit needs a pixel width, so it is measured from its container and
 * fills the footer on phones and a fixed 340px column from `sm` up.
 */
export function BookingSlider({ label, errorLabel, onConfirm, onDone, className }) {
  const { dark } = useTheme();
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setWidth(Math.round(el.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn('w-full sm:w-[340px]', className)} style={{ minHeight: HEIGHT }}>
      {width > 0 && (
        <SlideCommit
          width={width}
          height={HEIGHT}
          radius={18}
          label={label}
          doneLabel="Booked"
          errorLabel={errorLabel}
          onConfirm={onConfirm}
          onDone={onDone}
          trackColor={dark ? '#2e1b24' : '#ffe1e8'}
          handleColor="#FF69B4"
          successColor={dark ? '#3f9b74' : '#2f7d5b'}
          dangerColor="#FA8072"
          speed={55}
          holdMs={1500}
          className="es-slide"
        />
      )}
    </div>
  );
}

/**
 * React Bits <HoldButton> for cancelling a booking: press and hold so a stray
 * tap can never release someone's seats.
 */
export function CancelHold({ onHold, disabled, className }) {
  const { dark } = useTheme();
  return (
    <HoldButton
      size="sm"
      radius={12}
      holdTime={1400}
      resetAfter={1600}
      backgroundColor={dark ? '#2e1b24' : '#ffe1e8'}
      fillColor="#FA8072"
      textColor={dark ? '#FA8072' : '#a82a36'}
      fillTextColor={dark ? '#1a0b12' : '#2a1320'}
      icon={<XCircle className="size-4" aria-hidden />}
      doneLabel="Cancelling…"
      disabled={disabled}
      onHold={onHold}
      onTap={() => toast('Press and hold the button to cancel this booking')}
      className={cn('es-hold', className)}
    >
      Hold to cancel
    </HoldButton>
  );
}
