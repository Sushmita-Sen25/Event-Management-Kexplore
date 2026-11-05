import { useNavigate } from 'react-router';
import SpecularButton from '@/components/SpecularButton';
import { useTheme } from '@/hooks/theme';

/**
 * React Bits <SpecularButton> in the EventSphere plum: a solid plum pill whose
 * lavender rim catches a highlight that follows the pointer.
 */
export function ShineButton({ size = 'md', children, ...props }) {
  const { dark } = useTheme();
  return (
    <SpecularButton
      size={size}
      radius={14}
      tint="#722548"
      tintOpacity={1}
      textColor="#ffffff"
      lineColor={dark ? '#efe6fb' : '#ffffff'}
      baseColor={dark ? '#9682B9' : '#b58aa7'}
      intensity={1}
      idleIntensity={dark ? 0.45 : 0.6}
      glow={dark ? 1.1 : 0.8}
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
