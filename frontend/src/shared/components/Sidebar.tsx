import { NavLink, Link } from 'react-router';
import {
  LayoutDashboard,
  Users,
  FileText,
  X,
  Settings,
  FileOutput,
  LayoutTemplate,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string | undefined }>;
  disabled?: boolean;
  end?: boolean;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/clients', labelKey: 'nav.clients', icon: Users },
  {
    to: '/invoices',
    labelKey: 'nav.invoices',
    icon: FileText,
    children: [{ to: '/invoices/template', labelKey: 'nav.invoiceTemplate', icon: LayoutTemplate }],
  },
];

const SETTINGS_ITEMS: NavItem[] = [
  {
    to: '/settings/invoice-template',
    labelKey: 'nav.settingsInvoiceTemplate',
    icon: FileOutput,
  },
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
        'flex h-full flex-col border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-bg)]',
        collapsed ? 'w-16' : 'w-60',
      )}
      aria-label="Sidebar navigation"
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-[var(--color-sidebar-border)]">
        {!collapsed && (
          <span className="text-sm font-semibold text-[var(--color-sidebar-text)]">
            {t('common.appName')}
          </span>
        )}
        {drawerMode && onClose && (
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="ml-auto rounded-md p-1 hover:bg-[var(--color-sidebar-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sidebar-active-text)]"
            data-testid="sidebar-close"
          >
            <X className="h-4 w-4 text-[var(--color-sidebar-text)]" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Main navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, labelKey, icon: Icon, disabled, end, children }) => (
            <li key={to}>
              {disabled ? (
                <span
                  aria-disabled="true"
                  title={t('nav.invoicesComingSoon')}
                  className={cn(
                    'flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium opacity-50',
                    'text-[var(--color-sidebar-text)]',
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
                          ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)]'
                          : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-text)]',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden={true} />
                      {!collapsed && <span>{t(labelKey)}</span>}
                    </span>
                  )}
                </NavLink>
              )}
              {!collapsed && children && children.length > 0 && (
                <ul
                  className="ml-7 mt-0.5 space-y-0.5"
                  data-testid={`nav-children-${to.replace(/\//g, '-').replace(/^-/, '')}`}
                >
                  {children.map(({ to: childTo, labelKey: childLabelKey, icon: ChildIcon }) => (
                    <li key={childTo}>
                      <NavLink to={childTo}>
                        {({ isActive }) => (
                          <span
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                              'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                              isActive
                                ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)]'
                                : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-text)]',
                            )}
                          >
                            <ChildIcon className="h-3.5 w-3.5 shrink-0" aria-hidden={true} />
                            <span>{t(childLabelKey)}</span>
                          </span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {/* Settings section */}
        <div className="mt-4 pt-4 border-t border-[var(--color-sidebar-border)]">
          {!collapsed && (
            <Link
              to="/settings/invoice-template"
              className="mb-1 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-[var(--color-sidebar-hover-bg)] transition-colors"
            >
              <Settings
                className="h-3.5 w-3.5 text-[var(--color-sidebar-muted)]"
                aria-hidden={true}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sidebar-muted)]">
                {t('nav.settings')}
              </span>
            </Link>
          )}
          <ul className="space-y-1" data-testid="nav-settings-section">
            {SETTINGS_ITEMS.map(({ to, labelKey, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} {...(end !== undefined ? { end } : {})}>
                  {({ isActive }) => (
                    <span
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)]'
                          : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-text)]',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden={true} />
                      {!collapsed && <span>{t(labelKey)}</span>}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
