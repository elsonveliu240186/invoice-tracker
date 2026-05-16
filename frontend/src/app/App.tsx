import { Route, Routes } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { ClientsPage } from '@/pages/ClientsPage';
import { ClientDetailPage } from '@/pages/ClientDetailPage';
import { InvoiceDetailPage } from '@/pages/InvoiceDetailPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { InvoiceTemplateSettingsPage } from '@/pages/InvoiceTemplateSettingsPage';
import { InvoiceTemplateManagerPage } from '@/pages/InvoiceTemplateManagerPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ToastProvider } from '@/shared/ui/Toast';
import { AppShell } from '@/shared/components/AppShell';
import { EmptyState } from '@/shared/components/EmptyState';
import { Toaster } from '@/shared/ui/sonner';
import { ProtectedRoute } from '@/shared/ui/ProtectedRoute';
import { PublicOnlyRoute } from '@/shared/ui/PublicOnlyRoute';
import { PaletteProvider } from '@/shared/theme/PaletteProvider';

function NotFound() {
  return (
    <EmptyState title="Page not found" description="The page you are looking for does not exist." />
  );
}

export function App() {
  return (
    <ToastProvider>
      <Toaster />
      <PaletteProvider>
        <Routes>
          {/* Public-only routes: authenticated users are bounced to / */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Protected routes: unauthenticated users are sent to /login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:id" element={<ClientDetailPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/invoices/template" element={<InvoiceTemplateManagerPage />} />
              <Route path="/settings/invoice-template" element={<InvoiceTemplateSettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </PaletteProvider>
    </ToastProvider>
  );
}
