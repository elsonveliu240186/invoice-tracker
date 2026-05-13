import { AuthSplitLayout } from '@/features/auth/ui/AuthSplitLayout';
import { ForgotPasswordForm } from '@/features/auth/ui/ForgotPasswordForm';

export function ForgotPasswordPage() {
  return (
    <AuthSplitLayout>
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
