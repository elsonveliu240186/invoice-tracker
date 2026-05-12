import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="My Page" />);
    expect(screen.getByRole('heading', { name: 'My Page' })).toBeInTheDocument();
  });

  it('renders optional description', () => {
    render(<PageHeader title="My Page" description="A helpful description." />);
    expect(screen.getByText('A helpful description.')).toBeInTheDocument();
  });

  it('does not render description element when not provided', () => {
    render(<PageHeader title="My Page" />);
    expect(screen.queryByText('A helpful description.')).not.toBeInTheDocument();
  });

  it('renders optional actions slot', () => {
    render(
      <PageHeader title="My Page" actions={<button data-testid="action-btn">New Item</button>} />,
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });

  it('does not render actions wrapper when not provided', () => {
    const { container } = render(<PageHeader title="My Page" />);
    // Only the heading wrapper div should be present, no shrink-0 actions div
    const shrinkDivs = container.querySelectorAll('.shrink-0');
    expect(shrinkDivs).toHaveLength(0);
  });

  it('action button in actions slot fires click handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <PageHeader
        title="My Page"
        actions={
          <button onClick={onClick} data-testid="action-btn">
            Click
          </button>
        }
      />,
    );
    await user.click(screen.getByTestId('action-btn'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
