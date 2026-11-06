import { useNavigate } from 'react-router';
import SpecularButton from '@/components/SpecularButton';
import { useTheme } from '@/hooks/theme';

/**
 * React Bits <SpecularButton> in Eventique hot pink: a solid pink pill with
 * dark ink text whose rim catches a highlight that follows the pointer.
 */
export function ShineButton({ size = 'md', children, ...props }) {
  const { dark } = useTheme();
  return (
    <SpecularButton
      size={size}
      radius={14}
      tint="#FF69B4"
      tintOpacity={1}
      textColor={dark ? '#1a0b12' : '#2a1320'}
      lineColor="#ffffff"
      baseColor={dark ? '#FFB7D5' : '#FF66CC'}
      intensity={1}
      idleIntensity={dark ? 0.5 : 0.55}
      glow={dark ? 1 : 0.7}
      proximity={220}
      {...props}
    >
      {children}
    </SpecularButton>
  );
}

/**
 * "Browse events" call to action used in the header and empty states.
 * The component's stylesheet is unlayered, so Tailwind display utilities such as
 * `hidden lg:inline-flex` go on a wrapper rather than on the button itself.
 */
export function BrowseButton({ size = 'sm', label = 'Browse events', className, children }) {
  const navigate = useNavigate();
  return (
    <span className={className}>
      <ShineButton size={size} onClick={() => navigate('/events')}>
        {children}
        {label}
      </ShineButton>
    </span>
  );
}
