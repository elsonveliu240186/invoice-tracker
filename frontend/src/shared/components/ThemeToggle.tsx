import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useTheme } from '@/shared/theme/useTheme';
import type { Theme } from '@/shared/theme/themeStore';

const icons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const CurrentIcon = icons[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('common.theme')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      >
        <CurrentIcon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(['light', 'dark', 'system'] as Theme[]).map((option) => {
          const Icon = icons[option];
          const label = t(`common.${option}`);
          return (
            <DropdownMenuItem key={option} onClick={() => setTheme(option)}>
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {theme === option && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
