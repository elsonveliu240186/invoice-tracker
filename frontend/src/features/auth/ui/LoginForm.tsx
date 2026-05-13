import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Link, useNavigate, useLocation } from 'react-router';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { PasswordField } from './PasswordField';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useAuthStore } from '../model/useAuthStore';
import { loginSchema, type LoginInput } from '../model/schema';
import { ApiError } from '@/shared/lib/http';

export function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const isPending = status === 'pending';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    try {
      await login(data.email, data.password);
      await navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error(t('auth.errors.invalidCredentials'));
      } else {
        setError('root', { message: t('auth.errors.generic') });
      }
    }
  }

  function handleGoogleSuccess() {
    void navigate(from, { replace: true });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{t('auth.login.title')}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{t('auth.login.subtitle')}</p>
      </div>

      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e);
        }}
        noValidate
        className="space-y-4"
      >
        <div className="space-y-1">
          <label htmlFor="login-email" className="text-sm font-medium">
            {t('auth.email')}
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p
              id="login-email-error"
              className="text-xs text-[var(--color-destructive)]"
              role="alert"
            >
              {t(errors.email.message ?? '')}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="login-password" className="text-sm font-medium">
            {t('auth.password')}
          </label>
          <PasswordField
            id="login-password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p
              id="login-password-error"
              className="text-xs text-[var(--color-destructive)]"
              role="alert"
            >
              {t(errors.password.message ?? '')}
            </p>
          )}
        </div>

        {errors.root && (
          <p className="text-xs text-[var(--color-destructive)]" role="alert">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t('common.loading') : t('auth.signIn')}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--color-border)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--color-background)] px-2 text-[var(--color-muted-foreground)]">
            {t('auth.orContinueWith')}
          </span>
        </div>
      </div>

      <GoogleSignInButton onSuccess={handleGoogleSuccess} />

      <div className="space-y-2 text-center text-sm">
        <p>
          <Link
            to="/forgot-password"
            className="text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            {t('auth.forgotPassword')}
          </Link>
        </p>
        <p className="text-[var(--color-muted-foreground)]">
          {t('auth.dontHaveAccount')}{' '}
          <Link
            to="/register"
            className="text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
}
