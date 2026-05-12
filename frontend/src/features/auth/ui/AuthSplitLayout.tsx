import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { pageTransition } from '@/shared/lib/motion';
import type { ReactNode } from 'react';

interface AuthSplitLayoutProps {
  children: ReactNode;
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      {/* Brand panel — left, hidden on small screens */}
      <div
        className="hidden md:flex md:w-1/2 flex-col items-center justify-center bg-[var(--color-primary)] p-12 text-[var(--color-primary-foreground)]"
        data-testid="brand-panel"
      >
        <div className="max-w-sm space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">{t('common.appName')}</h1>
          <p className="text-lg opacity-90">{t('auth.brand.tagline')}</p>
          <p className="text-sm opacity-70">{t('auth.brand.description')}</p>
        </div>
      </div>

      {/* Form panel — right (full width on mobile) */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6">
        <motion.div
          className="w-full max-w-sm"
          variants={pageTransition}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
