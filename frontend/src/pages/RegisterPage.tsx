import { AuthSplitLayout } from '@/features/auth/ui/AuthSplitLayout';
import { RegisterForm } from '@/features/auth/ui/RegisterForm';

export function RegisterPage() {
  return (
    <AuthSplitLayout>
      <RegisterForm />
    </AuthSplitLayout>
  );
}
