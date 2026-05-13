import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

function renderDialog(props: Partial<React.ComponentProps<typeof ConfirmDeleteDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <I18nextProvider i18n={i18n}>
      <ConfirmDeleteDialog
        open={true}
        clientName="Acme Corp"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      />
    </I18nextProvider>,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDeleteDialog', () => {
  it('renders when open=true', () => {
    renderDialog({ open: true });
    expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    renderDialog({ open: false });
    expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
  });

  it('shows the client name in the description', () => {
    renderDialog({ clientName: 'Globex' });
    expect(screen.getByText(/Globex/)).toBeInTheDocument();
  });

  it('shows translated title', () => {
    renderDialog();
    expect(screen.getByText('Delete client')).toBeInTheDocument();
  });

  it('shows translated cancel and delete button labels', () => {
    renderDialog();
    expect(screen.getByTestId('btn-cancel-delete')).toHaveTextContent('Cancel');
    expect(screen.getByTestId('btn-confirm-delete')).toHaveTextContent('Delete');
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog();
    await user.click(screen.getByTestId('btn-confirm-delete'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();
    await user.click(screen.getByTestId('btn-cancel-delete'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when dialog is closed via open state change', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();
    // Press Escape to close dialog
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
