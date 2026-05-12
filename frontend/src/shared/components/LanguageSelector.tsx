import { Languages, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

const SUPPORTED_LANGUAGES = [{ code: 'en', label: 'English' }] as const;

export function LanguageSelector() {
  const { t, i18n } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('common.language')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      >
        <Languages className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGUAGES.map(({ code, label }) => (
          <DropdownMenuItem key={code} onClick={() => void i18n.changeLanguage(code)}>
            <span>{label}</span>
            {i18n.language === code && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
