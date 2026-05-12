import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { PasswordField } from './PasswordField';
import { useAuthStore } from '../model/useAuthStore';
import { registerSchema, type RegisterInput } from '../model/schema';
import { ApiError } from '@/shared/lib/http';

export function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register_ = useAuthStore((s) => s.register);
  const status = useAuthStore((s) => s.status);
  const isPending = status === 'pending';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    try {
      await register_(data.displayName, data.email, data.password);
      toast.success(t('auth.success.registered'));
      await navigate('/login', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error(t('auth.errors.emailTaken'));
      } else {
        toast.error(t('auth.errors.generic'));
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{t('auth.register.title')}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t('auth.register.subtitle')}
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
          <label htmlFor="reg-name" className="text-sm font-medium">
            {t('auth.displayName')}
          </label>
          <Input
            id="reg-name"
            type="text"
            autoComplete="name"
            placeholder="Alice Smith"
            aria-invalid={!!errors.displayName}
            aria-describedby={errors.displayName ? 'reg-name-error' : undefined}
            {...register('displayName')}
          />
          {errors.displayName && (
            <p id="reg-name-error" className="text-xs text-[var(--color-destructive)]" role="alert">
              {t(errors.displayName.message ?? '')}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="reg-email" className="text-sm font-medium">
            {t('auth.email')}
          </label>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'reg-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p
              id="reg-email-error"
              className="text-xs text-[var(--color-destructive)]"
              role="alert"
            >
              {t(errors.email.message ?? '')}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="reg-password" className="text-sm font-medium">
            {t('auth.password')}
          </label>
          <PasswordField
            id="reg-password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'reg-password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p
              id="reg-password-error"
              className="text-xs text-[var(--color-destructive)]"
              role="alert"
            >
              {t(errors.password.message ?? '')}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="reg-confirm-password" className="text-sm font-medium">
            {t('auth.confirmPassword')}
          </label>
          <PasswordField
            id="reg-confirm-password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'reg-confirm-error' : undefined}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p
              id="reg-confirm-error"
              className="text-xs text-[var(--color-destructive)]"
              role="alert"
            >
              {t(errors.confirmPassword.message ?? '')}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t('common.loading') : t('auth.signUp')}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link
          to="/login"
          className="text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  );
}
