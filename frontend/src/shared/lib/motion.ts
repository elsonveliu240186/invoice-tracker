import type { Variants, Transition } from 'framer-motion';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: prefersReducedMotion() ? 0 : 0.2 } as Transition,
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: prefersReducedMotion() ? 0 : 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: prefersReducedMotion() ? 0 : 0.3 } as Transition,
  },
};

export const staggerChildren: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: prefersReducedMotion() ? 0 : 0.05,
    } as Transition,
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: prefersReducedMotion() ? 0 : 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: prefersReducedMotion() ? 0 : 0.25, ease: 'easeOut' } as Transition,
  },
  exit: {
    opacity: 0,
    transition: { duration: prefersReducedMotion() ? 0 : 0.15 } as Transition,
  },
};
