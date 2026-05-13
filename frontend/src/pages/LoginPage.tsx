import { AuthSplitLayout } from '@/features/auth/ui/AuthSplitLayout';
import { LoginForm } from '@/features/auth/ui/LoginForm';

export function LoginPage() {
  return (
    <AuthSplitLayout>
      <LoginForm />
    </AuthSplitLayout>
  );
}
