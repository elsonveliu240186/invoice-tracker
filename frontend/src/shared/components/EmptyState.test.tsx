import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders optional description', () => {
    render(<EmptyState title="No items" description="Create your first item." />);
    expect(screen.getByText('Create your first item.')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByText('Create your first item.')).not.toBeInTheDocument();
  });

  it('renders optional icon', () => {
    render(<EmptyState title="No items" icon={<span data-testid="icon">icon</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('does not render icon wrapper when not provided', () => {
    const { container } = render(<EmptyState title="No items" />);
    // No aria-hidden icon wrapper present
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it('renders action slot and calls callback on click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No items"
        action={
          <button onClick={onClick} data-testid="action-btn">
            Create
          </button>
        }
      />,
    );
    await user.click(screen.getByTestId('action-btn'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action wrapper when action not provided', () => {
    render(<EmptyState title="No items" />);
    // The mt-6 action div should not be present
    const title = screen.getByText('No items');
    expect(title.nextSibling).toBeNull();
  });

  it('accepts additional className', () => {
    const { container } = render(<EmptyState title="No items" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
