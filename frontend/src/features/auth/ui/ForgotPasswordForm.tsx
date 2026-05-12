import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Link } from 'react-router';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useAuthStore } from '../model/useAuthStore';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../model/schema';

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const status = useAuthStore((s) => s.status);
  const isPending = status === 'pending';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    await forgotPassword(data.email);
    // Always show the same generic toast — anti-enumeration
    toast.success(t('auth.success.passwordResetSent'));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t('auth.forgotPasswordPage.title')}
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t('auth.forgotPasswordPage.subtitle')}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e);
        }}
        noValidate
        className="space-y-4"
      >
        <div className="space-y-1">
          <label htmlFor="fp-email" className="text-sm font-medium">
            {t('auth.email')}
          </label>
          <Input
            id="fp-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'fp-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="fp-email-error" className="text-xs text-[var(--color-destructive)]" role="alert">
              {t(errors.email.message ?? '')}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t('common.loading') : t('auth.forgotPasswordPage.submit')}
        </Button>
      </form>

      <p className="text-center text-sm">
        <Link
          to="/login"
          className="text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          {t('auth.backToSignIn')}
        </Link>
      </p>
    </div>
  );
}
