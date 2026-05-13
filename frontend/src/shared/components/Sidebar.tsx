import { NavLink } from 'react-router';
import { LayoutDashboard, Users, FileText, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string | undefined }>;
  disabled?: boolean;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/clients', labelKey: 'nav.clients', icon: Users },
  { to: '/invoices', labelKey: 'nav.invoices', icon: FileText, disabled: true },
];

interface SidebarProps {
  collapsed?: boolean;
  drawerMode?: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed = false, drawerMode = false, onClose }: SidebarProps) {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-card)]',
        collapsed ? 'w-16' : 'w-60',
      )}
      aria-label="Sidebar navigation"
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-[var(--color-border)]">
        {!collapsed && (
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            {t('common.appName')}
          </span>
        )}
        {drawerMode && onClose && (
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="ml-auto rounded-md p-1 hover:bg-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            data-testid="sidebar-close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Main navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, labelKey, icon: Icon, disabled, end }) => (
            <li key={to}>
              {disabled ? (
                <span
                  aria-disabled="true"
                  title={t('nav.invoicesComingSoon')}
                  className={cn(
                    'flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium opacity-50',
                    'text-[var(--color-muted-foreground)]',
                  )}
                  data-testid="nav-item-disabled"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden={true} />
                  {!collapsed && <span>{t(labelKey)}</span>}
                </span>
              ) : (
                <NavLink to={to} {...(end !== undefined ? { end } : {})}>
                  {({ isActive }) => (
                    <span
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                          : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden={true} />
                      {!collapsed && <span>{t(labelKey)}</span>}
                    </span>
                  )}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
