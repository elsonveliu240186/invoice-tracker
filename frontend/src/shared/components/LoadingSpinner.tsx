import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';

type Size = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: Size;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  return (
    <svg
      role="status"
      aria-label={t('common.loading')}
      className={cn(
        'animate-spin text-[var(--color-muted-foreground)]',
        sizeClasses[size],
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
