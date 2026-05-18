import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { DashboardDateFilter } from './DashboardDateFilter';

function renderFilter(
  props: {
    from?: string | null;
    to?: string | null;
    onChange?: (from: string | null, to: string | null) => void;
  } = {},
) {
  const onChange = props.onChange ?? vi.fn();
  return {
    onChange,
    user: userEvent.setup(),
    ...render(
      <I18nextProvider i18n={i18n}>
        <DashboardDateFilter from={props.from ?? null} to={props.to ?? null} onChange={onChange} />
      </I18nextProvider>,
    ),
  };
}

describe('DashboardDateFilter', () => {
  it('renders the filter button', () => {
    renderFilter();
    expect(screen.getByTestId('dashboard-date-filter')).toBeInTheDocument();
  });

  it('opens popover on button click', async () => {
    const { user } = renderFilter();
    await user.click(screen.getByTestId('dashboard-date-filter'));
    await waitFor(() => {
      expect(screen.getByTestId('date-filter-from')).toBeInTheDocument();
      expect(screen.getByTestId('date-filter-to')).toBeInTheDocument();
      expect(screen.getByTestId('date-filter-apply')).toBeInTheDocument();
      expect(screen.getByTestId('date-filter-clear')).toBeInTheDocument();
    });
  });

  it('apply calls onChange with entered values', async () => {
    const onChange = vi.fn();
    const { user } = renderFilter({ onChange });

    await user.click(screen.getByTestId('dashboard-date-filter'));
    await waitFor(() => expect(screen.getByTestId('date-filter-from')).toBeInTheDocument());

    await user.type(screen.getByTestId('date-filter-from'), '2026-01-01');
    await user.type(screen.getByTestId('date-filter-to'), '2026-05-31');
    await user.click(screen.getByTestId('date-filter-apply'));

    expect(onChange).toHaveBeenCalled();
    const [calledFrom, calledTo] = onChange.mock.calls[onChange.mock.calls.length - 1] as [
      string | null,
      string | null,
    ];
    expect(calledFrom).toBeTruthy();
    expect(calledTo).toBeTruthy();
  });

  it('clear calls onChange with nulls', async () => {
    const onChange = vi.fn();
    const { user } = renderFilter({ from: '2026-01-01', to: '2026-05-31', onChange });

    await user.click(screen.getByTestId('dashboard-date-filter'));
    await waitFor(() => expect(screen.getByTestId('date-filter-clear')).toBeInTheDocument());

    await user.click(screen.getByTestId('date-filter-clear'));
    expect(onChange).toHaveBeenCalledWith(null, null);
  });

  it('button has active styling when filter is set', () => {
    renderFilter({ from: '2026-01-01', to: null });
    const btn = screen.getByTestId('dashboard-date-filter');
    expect(btn.className).toContain('--color-primary');
  });

  it('button does not have active styling when filter is not set', () => {
    renderFilter({ from: null, to: null });
    const btn = screen.getByTestId('dashboard-date-filter');
    expect(btn.className).not.toContain('--color-primary');
  });

  it('popover shows From/To labels after open', async () => {
    const { user } = renderFilter();
    await user.click(screen.getByTestId('dashboard-date-filter'));
    await waitFor(() => {
      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('To')).toBeInTheDocument();
    });
  });

  it('apply with empty values calls onChange with nulls', async () => {
    const onChange = vi.fn();
    const { user } = renderFilter({ onChange });
    await user.click(screen.getByTestId('dashboard-date-filter'));
    await waitFor(() => expect(screen.getByTestId('date-filter-apply')).toBeInTheDocument());
    await user.click(screen.getByTestId('date-filter-apply'));
    expect(onChange).toHaveBeenCalledWith(null, null);
  });

  it('popover stays open when clicking outside — only Apply/Clear close it', async () => {
    const { user } = renderFilter();
    await user.click(screen.getByTestId('dashboard-date-filter'));
    await waitFor(() => expect(screen.getByTestId('date-filter-from')).toBeInTheDocument());

    // Click outside the popover (on document body)
    await user.click(document.body);

    // Popover should still be visible
    expect(screen.getByTestId('date-filter-from')).toBeInTheDocument();
  });

  it('popover closes after Apply is clicked', async () => {
    const onChange = vi.fn();
    const { user } = renderFilter({ onChange });
    await user.click(screen.getByTestId('dashboard-date-filter'));
    await waitFor(() => expect(screen.getByTestId('date-filter-apply')).toBeInTheDocument());
    await user.click(screen.getByTestId('date-filter-apply'));
    await waitFor(() => {
      expect(screen.queryByTestId('date-filter-from')).not.toBeInTheDocument();
    });
  });

  it('popover closes after Clear is clicked', async () => {
    const onChange = vi.fn();
    const { user } = renderFilter({ from: '2026-01-01', to: '2026-05-31', onChange });
    await user.click(screen.getByTestId('dashboard-date-filter'));
    await waitFor(() => expect(screen.getByTestId('date-filter-clear')).toBeInTheDocument());
    await user.click(screen.getByTestId('date-filter-clear'));
    await waitFor(() => {
      expect(screen.queryByTestId('date-filter-from')).not.toBeInTheDocument();
    });
  });
});
