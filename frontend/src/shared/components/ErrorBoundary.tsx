import { Component, type ReactNode, type ErrorInfo } from 'react';
import { EmptyState } from './EmptyState';
import i18n from '@/shared/lib/i18n';

interface ErrorBoundaryProps {
  children: ReactNode;
  resetError?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.resetError) {
      this.props.resetError();
    } else {
      window.location.reload();
    }
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <EmptyState
            title={i18n.t('errors.boundary.title')}
            description={i18n.t('errors.boundary.body')}
            action={
              <button
                onClick={this.handleRetry}
                className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                data-testid="error-retry-btn"
              >
                {i18n.t('errors.boundary.action')}
              </button>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}
