import { Route, Routes } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { ClientsPage } from '@/pages/ClientsPage';
import { ToastProvider } from '@/shared/ui/Toast';

export function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clients" element={<ClientsPage />} />
      </Routes>
    </ToastProvider>
  );
}
