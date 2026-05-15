import type { LucideProps } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/shared/lib/cn';

type IconSize = 'xs' | 'sm' | 'md' | 'lg';

const sizes: Record<IconSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export interface IconProps extends Omit<LucideProps, 'ref'> {
  /** Lucide icon component to render. */
  as: ComponentType<LucideProps>;
  /** Size variant — maps to Tailwind h/w classes. Defaults to "sm" (16 × 16). */
  size?: IconSize;
  /**
   * Whether the icon is decorative (hidden from assistive technology).
   * Defaults to true — pass `false` only for standalone meaningful icons
   * that have no adjacent visible label.
   */
  ariaHidden?: boolean;
}

/**
 * Thin wrapper around Lucide icons that enforces `currentColor` inheritance,
 * sets `aria-hidden` by default, and provides a consistent size scale.
 *
 * Usage:
 *   import { Icon } from '@/shared/ui/Icon';
 *   import { Eye } from 'lucide-react';
 *   <Icon as={Eye} size="sm" />
 */
export function Icon({
  as: Component,
  size = 'sm',
  ariaHidden = true,
  className,
  ...props
}: IconProps) {
  return <Component className={cn(sizes[size], className)} aria-hidden={ariaHidden} {...props} />;
}
