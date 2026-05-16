import { useState, useEffect, type ReactNode } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { PageContainer } from './PageContainer';
import { ErrorBoundary } from './ErrorBoundary';

interface AppShellProps {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (!e.matches) setDrawerOpen(false);
    };
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  function openDrawer() {
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <div className="flex h-full min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Desktop sidebar */}
      {!isMobile && (
        <div className="hidden lg:flex lg:flex-col lg:shrink-0" data-testid="desktop-sidebar">
          <Sidebar />
        </div>
      )}

      {/* Mobile drawer overlay */}
      {isMobile && drawerOpen && (
        <div
          className="fixed inset-0 z-40"
          data-testid="drawer-overlay"
          aria-modal="true"
          role="dialog"
          aria-label="Navigation drawer"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDrawer}
            aria-hidden="true"
            data-testid="drawer-backdrop"
          />
          {/* Drawer panel */}
          <div className="relative z-10 h-full w-60" data-testid="drawer-panel">
            <Sidebar drawerMode onClose={closeDrawer} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopNav onMenuClick={openDrawer} />
        <main className="flex-1">
          <ErrorBoundary>
            <PageContainer>{children ?? <Outlet />}</PageContainer>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
