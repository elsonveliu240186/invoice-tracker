import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, prefersReducedMotion } from '@/shared/lib/motion';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  if (prefersReducedMotion()) {
    return (
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className ?? ''}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className ?? ''}`}
    >
      {children}
    </motion.div>
  );
}
