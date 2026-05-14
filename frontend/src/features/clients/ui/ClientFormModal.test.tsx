import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ClientFormModal } from './ClientFormModal';

function renderModal(props: Partial<Parameters<typeof ClientFormModal>[0]> = {}) {
  const defaults = {
    title: 'Test Modal',
    open: true,
    onClose: vi.fn(),
    children: <p>Modal content</p>,
  };
  return render(<ClientFormModal {...defaults} {...props} />);
}

describe('ClientFormModal', () => {
  it('renders the modal when open=true', () => {
    renderModal();
    expect(screen.getByTestId('client-modal')).toBeInTheDocument();
  });

  it('renders the title', () => {
    renderModal({ title: 'Create Client' });
    expect(screen.getByText('Create Client')).toBeInTheDocument();
  });

  it('renders children inside the modal', () => {
    renderModal({ children: <span data-testid="child">Hello</span> });
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('does not render modal content when open=false', () => {
    renderModal({ open: false });
    expect(screen.queryByTestId('client-modal')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });
    await user.click(screen.getByTestId('modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
