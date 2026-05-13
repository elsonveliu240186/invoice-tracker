import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// Suppress console.error for expected error boundary output
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="child-content">Child content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders fallback with i18n strings when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    // These strings come from en.json errors.boundary.*
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByTestId('error-retry-btn')).toBeInTheDocument();
  });

  it('calls resetError prop and resets state on retry click', async () => {
    const user = userEvent.setup();
    const resetError = vi.fn();

    render(
      <ErrorBoundary resetError={resetError}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    await user.click(screen.getByTestId('error-retry-btn'));
    expect(resetError).toHaveBeenCalledTimes(1);
  });

  it('calls window.location.reload when no resetError prop provided', async () => {
    const user = userEvent.setup();
    const reloadMock = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload: reloadMock });

    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    await user.click(screen.getByTestId('error-retry-btn'));
    expect(reloadMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('logs error via console.error', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('resets hasError state after retry with resetError', async () => {
    const user = userEvent.setup();

    // Use a wrapper that controls whether the child throws
    function Wrapper() {
      const [throwing, setThrowing] = React.useState(true);
      return (
        <ErrorBoundary resetError={() => setThrowing(false)}>
          <ThrowingChild shouldThrow={throwing} />
        </ErrorBoundary>
      );
    }

    render(<Wrapper />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    await user.click(screen.getByTestId('error-retry-btn'));

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
