import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast } from './Toast';

function TestConsumer({ variant }: { variant?: 'success' | 'error' | 'info' }) {
  const { show } = useToast();
  return (
    <button onClick={() => show('Test message', variant)}>Show Toast</button>
  );
}

describe('ToastProvider', () => {
  it('shows a toast when show() is called', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('dismisses toast when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: /show toast/i }));
    const dismiss = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismiss);
    await waitFor(() => {
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    });
  });

  it('auto-dismisses after 4 seconds', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByRole('button').click();
    });

    expect(screen.getByTestId('toast')).toBeInTheDocument();

    void act(() => vi.advanceTimersByTime(4100));
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('renders success variant', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer variant="success" />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();
  });

  it('renders error variant', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer variant="error" />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();
  });

  it('renders default info variant when no variant is provided', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();
  });
});

describe('useToast', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws if used outside ToastProvider', () => {
    expect(() => render(<TestConsumer />)).toThrow('useToast must be used inside <ToastProvider>');
  });
});
