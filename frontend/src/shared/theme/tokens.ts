/**
 * Design token map — single source of truth for the invoice-tracker UI.
 *
 * All values mirror `src/index.css` @theme / :root / .dark blocks.
 * Consumers reference these keys; never hard-code raw CSS values in components.
 */

export const colors = {
  light: {
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222 47% 11%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(222 47% 11%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(222 47% 11%)',
    primary: 'hsl(222 47% 11%)',
    primaryForeground: 'hsl(210 40% 98%)',
    secondary: 'hsl(210 40% 96%)',
    secondaryForeground: 'hsl(222 47% 11%)',
    muted: 'hsl(210 40% 96%)',
    mutedForeground: 'hsl(215 16% 47%)',
    accent: 'hsl(210 40% 96%)',
    accentForeground: 'hsl(222 47% 11%)',
    destructive: 'hsl(0 84% 60%)',
    destructiveForeground: 'hsl(210 40% 98%)',
    border: 'hsl(214 32% 91%)',
    input: 'hsl(214 32% 91%)',
    ring: 'hsl(222 47% 11%)',
  },
  dark: {
    background: 'hsl(222 47% 11%)',
    foreground: 'hsl(210 40% 98%)',
    card: 'hsl(222 47% 14%)',
    cardForeground: 'hsl(210 40% 98%)',
    popover: 'hsl(222 47% 14%)',
    popoverForeground: 'hsl(210 40% 98%)',
    primary: 'hsl(210 40% 98%)',
    primaryForeground: 'hsl(222 47% 11%)',
    secondary: 'hsl(217 33% 17%)',
    secondaryForeground: 'hsl(210 40% 98%)',
    muted: 'hsl(217 33% 17%)',
    mutedForeground: 'hsl(215 20% 65%)',
    accent: 'hsl(217 33% 17%)',
    accentForeground: 'hsl(210 40% 98%)',
    destructive: 'hsl(0 62% 30%)',
    destructiveForeground: 'hsl(210 40% 98%)',
    border: 'hsl(217 33% 17%)',
    input: 'hsl(217 33% 17%)',
    ring: 'hsl(212 95% 68%)',
  },
} as const;

/** CSS variable references — use in `className` strings. */
export const cssVars = {
  background: 'var(--color-background)',
  foreground: 'var(--color-foreground)',
  card: 'var(--color-card)',
  cardForeground: 'var(--color-card-foreground)',
  primary: 'var(--color-primary)',
  primaryForeground: 'var(--color-primary-foreground)',
  secondary: 'var(--color-secondary)',
  secondaryForeground: 'var(--color-secondary-foreground)',
  muted: 'var(--color-muted)',
  mutedForeground: 'var(--color-muted-foreground)',
  accent: 'var(--color-accent)',
  accentForeground: 'var(--color-accent-foreground)',
  destructive: 'var(--color-destructive)',
  destructiveForeground: 'var(--color-destructive-foreground)',
  border: 'var(--color-border)',
  input: 'var(--color-input)',
  ring: 'var(--color-ring)',
} as const;

/**
 * Typography scale.
 * Line-heights follow Tailwind defaults: leading-tight (1.25), leading-snug (1.375),
 * leading-normal (1.5), leading-relaxed (1.625).
 */
export const font = {
  family: "'Inter', ui-sans-serif, system-ui, sans-serif",
  size: {
    xs: '0.75rem', // text-xs
    sm: '0.875rem', // text-sm
    base: '1rem', // text-base
    lg: '1.125rem', // text-lg
    xl: '1.25rem', // text-xl
    '2xl': '1.5rem', // text-2xl
    '3xl': '1.875rem', // text-3xl
  },
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
  },
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

/** Spacing scale — Tailwind 4px base unit. */
export const space = {
  0: '0px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const;

/** Border radius tokens. */
export const radius = {
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  full: '9999px',
} as const;

/** Box shadow tokens. */
export const shadow = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
} as const;

/** Responsive breakpoints (px). */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/**
 * Component state classes (Tailwind utility strings).
 * Reference: https://tailwindcss.com/docs/hover-focus-and-other-states
 */
export const state = {
  default: '',
  hover: 'hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
  focusVisible:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
  disabled: 'disabled:cursor-not-allowed disabled:opacity-50',
  error:
    'border-[var(--color-destructive)] focus-visible:ring-[var(--color-destructive)] text-[var(--color-destructive)]',
} as const;

/** Complete token map for documentation generation. */
export const tokens = {
  colors,
  cssVars,
  font,
  space,
  radius,
  shadow,
  breakpoints,
  state,
} as const;

export type TokenMap = typeof tokens;
