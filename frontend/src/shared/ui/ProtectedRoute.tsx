import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/features/auth/model/useAuthStore';

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'authenticated') {
    return <Outlet />;
  }

  return <Navigate to="/login" state={{ from: location }} replace />;
}
