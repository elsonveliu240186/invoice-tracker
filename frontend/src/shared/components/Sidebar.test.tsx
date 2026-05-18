import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { Sidebar } from './Sidebar';

function renderSidebar(props: Parameters<typeof Sidebar>[0] = {}, initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <I18nextProvider i18n={i18n}>
        <Sidebar {...props} />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  it('renders all navigation items (Dashboard, Clients, Invoices)', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Invoices')).toBeInTheDocument();
  });

  it('Invoices nav item is a link (no longer disabled)', () => {
    renderSidebar();
    // Now that the Invoices feature is live, the item is a NavLink, not a disabled span
    expect(screen.queryByTestId('nav-item-disabled')).not.toBeInTheDocument();
    expect(screen.getByText('Invoices')).toBeInTheDocument();
  });

  it('marks the active route with aria-current="page" on Clients', () => {
    renderSidebar({}, '/clients');
    const clientsSpan = screen.getByText('Clients').closest('span[aria-current]');
    expect(clientsSpan).toHaveAttribute('aria-current', 'page');
  });

  it('Dashboard route is active at "/"', () => {
    renderSidebar({}, '/');
    const dashSpan = screen.getByText('Dashboard').closest('span[aria-current]');
    expect(dashSpan).toHaveAttribute('aria-current', 'page');
  });

  it('hides text labels when collapsed', () => {
    renderSidebar({ collapsed: true });
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Clients')).not.toBeInTheDocument();
    expect(screen.queryByText('Invoices')).not.toBeInTheDocument();
  });

  it('renders the Settings section with Invoice Template link', () => {
    renderSidebar();
    expect(screen.getByTestId('nav-settings-section')).toBeInTheDocument();
    expect(screen.getByText('Invoice Template')).toBeInTheDocument();
  });

  it('renders Company Profile link in settings section', () => {
    renderSidebar();
    expect(screen.getByText('Company Profile')).toBeInTheDocument();
  });

  it('Company Profile link navigates to /settings/company', () => {
    renderSidebar();
    const link = screen.getByText('Company Profile').closest('a');
    expect(link).toHaveAttribute('href', '/settings/company');
  });

  it('marks Company Profile as active at /settings/company', () => {
    renderSidebar({}, '/settings/company');
    const span = screen.getByText('Company Profile').closest('span[aria-current]');
    expect(span).toHaveAttribute('aria-current', 'page');
  });

  it('Invoices nav item has no child sub-items', () => {
    renderSidebar();
    expect(screen.queryByTestId('nav-children-invoices')).not.toBeInTheDocument();
  });

  it('Invoice Template link navigates to /settings/invoice-template', () => {
    renderSidebar();
    const link = screen.getByText('Invoice Template').closest('a');
    expect(link).toHaveAttribute('href', '/settings/invoice-template');
  });

  it('marks Invoice Template as active at /settings/invoice-template', () => {
    renderSidebar({}, '/settings/invoice-template');
    const span = screen.getByText('Invoice Template').closest('span[aria-current]');
    expect(span).toHaveAttribute('aria-current', 'page');
  });

  it('shows Settings section label when not collapsed', () => {
    renderSidebar();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('hides Settings section label when collapsed', () => {
    renderSidebar({ collapsed: true });
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Invoice Template')).not.toBeInTheDocument();
  });

  it('shows close button in drawer mode', () => {
    const onClose = vi.fn();
    renderSidebar({ drawerMode: true, onClose });
    expect(screen.getByTestId('sidebar-close')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked in drawer mode', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderSidebar({ drawerMode: true, onClose });
    await user.click(screen.getByTestId('sidebar-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when not in drawer mode', () => {
    renderSidebar({ drawerMode: false });
    expect(screen.queryByTestId('sidebar-close')).not.toBeInTheDocument();
  });

  it('shows app name when not collapsed', () => {
    renderSidebar();
    expect(screen.getByText('Invoice Tracker')).toBeInTheDocument();
  });

  it('hides app name when collapsed', () => {
    renderSidebar({ collapsed: true });
    expect(screen.queryByText('Invoice Tracker')).not.toBeInTheDocument();
  });

  it('sidebar root element uses bg-[var(--color-sidebar-bg)] class token', () => {
    const { container } = renderSidebar();
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('--color-sidebar-bg');
  });

  it('sidebar background token does not change when .dark is toggled on html', () => {
    const { container } = renderSidebar();
    const aside = container.querySelector('aside');
    const classBefore = aside?.className ?? '';
    document.documentElement.classList.add('dark');
    // Class string on the element itself does not change — only CSS resolution changes
    expect(aside?.className).toBe(classBefore);
    document.documentElement.classList.remove('dark');
  });
});
