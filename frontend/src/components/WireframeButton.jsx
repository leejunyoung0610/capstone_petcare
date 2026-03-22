import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/utils';

const variantStyles = {
  primary: 'border-brand-link bg-blue-50 text-blue-800 hover:bg-blue-100',
  secondary: 'border-muted-foreground/50 bg-muted text-foreground hover:bg-muted/80',
  outline: 'border-border bg-card text-foreground hover:bg-muted',
};

export function WireframeButton({
  children,
  variant = 'primary',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  asChild = false,
}) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      type={asChild ? undefined : type}
      disabled={asChild ? undefined : disabled}
      onClick={asChild ? undefined : onClick}
      className={cn(
        'inline-flex items-center justify-center border-2 px-6 py-2 font-mono text-sm font-semibold transition-colors',
        variantStyles[variant] || variantStyles.primary,
        disabled && !asChild && 'pointer-events-none opacity-50',
        className
      )}
    >
      {children}
    </Comp>
  );
}
