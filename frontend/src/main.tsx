import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './app/App';
import './shared/lib/i18n';
import './index.css';
import { ThemeProvider } from './shared/theme/ThemeProvider';
import { LoadingSpinner } from './shared/components/LoadingSpinner';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('root element missing');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          <App />
        </Suspense>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
