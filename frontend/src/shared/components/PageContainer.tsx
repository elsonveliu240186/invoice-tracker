import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, prefersReducedMotion } from '@/shared/lib/motion';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  if (prefersReducedMotion()) {
    return <div className={`w-full px-6 py-6 ${className ?? ''}`}>{children}</div>;
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`w-full px-6 py-6 ${className ?? ''}`}
    >
      {children}
    </motion.div>
  );
}
