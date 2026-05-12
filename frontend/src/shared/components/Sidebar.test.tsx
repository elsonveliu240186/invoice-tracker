import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { Sidebar } from './Sidebar';

function renderSidebar(props: Parameters<typeof Sidebar>[0] = {}) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <I18nextProvider i18n={i18n}>
        <Sidebar {...props} />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  it('renders all navigation items', () => {
    renderSidebar();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Invoices')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('marks the active route with aria-current="page"', () => {
    render(
      <MemoryRouter initialEntries={['/clients']}>
        <I18nextProvider i18n={i18n}>
          <Sidebar />
        </I18nextProvider>
      </MemoryRouter>,
    );
    // aria-current is on the inner span rendered by NavLink's render prop
    const clientsSpan = screen.getByText('Clients').closest('span[aria-current]');
    expect(clientsSpan).toHaveAttribute('aria-current', 'page');
  });

  it('home route is active at "/"', () => {
    renderSidebar();
    const homeSpan = screen.getByText('Home').closest('span[aria-current]');
    expect(homeSpan).toHaveAttribute('aria-current', 'page');
  });

  it('hides text labels when collapsed', () => {
    renderSidebar({ collapsed: true });
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Clients')).not.toBeInTheDocument();
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
});
