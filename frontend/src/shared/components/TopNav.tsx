import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';

interface TopNavProps {
  onMenuClick?: () => void;
  children?: ReactNode;
}

export function TopNav({ onMenuClick, children }: TopNavProps) {
  const { t } = useTranslation();

  return (
    <header className="flex h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-card)] px-4">
      {/* Hamburger (mobile only) */}
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        data-testid="hamburger"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb / title slot */}
      <div className="flex-1 min-w-0">{children}</div>

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        <LanguageSelector />
        <ThemeToggle />
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {t('common.appName').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
