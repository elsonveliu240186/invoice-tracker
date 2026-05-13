import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';
import type { InputProps } from '@/shared/ui/input';

interface PasswordFieldProps extends Omit<InputProps, 'type'> {
  className?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ className, ...props }, ref) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    return (
      <div className={cn('relative', className)}>
        <Input type={visible ? 'text' : 'password'} className="pr-10" ref={ref} {...props} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          aria-pressed={visible}
          className="absolute right-0 top-0 h-full w-9 shrink-0 hover:bg-transparent"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <EyeOff className="h-4 w-4 text-[var(--color-muted-foreground)]" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4 text-[var(--color-muted-foreground)]" aria-hidden="true" />
          )}
        </Button>
      </div>
    );
  },
);
