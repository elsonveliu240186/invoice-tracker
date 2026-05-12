import { Route, Routes } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { ClientsPage } from '@/pages/ClientsPage';
import { ToastProvider } from '@/shared/ui/Toast';
import { AppShell } from '@/shared/components/AppShell';
import { EmptyState } from '@/shared/components/EmptyState';
import { Toaster } from '@/shared/ui/sonner';

function NotFound() {
  return (
    <EmptyState title="Page not found" description="The page you are looking for does not exist." />
  );
}

export function App() {
  return (
    <ToastProvider>
      <Toaster />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
