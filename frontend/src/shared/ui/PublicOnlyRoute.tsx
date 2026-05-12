import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/features/auth/model/useAuthStore';

export function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  if (status === 'authenticated') {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
