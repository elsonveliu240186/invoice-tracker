import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';

vi.mock('firebase/auth', () => {
  let _result: Record<string, unknown> | null = null;
  let _error: Error | null = null;
  return {
    GoogleAuthProvider: vi.fn(() => ({})),
    signInWithPopup: vi.fn(() => {
      if (_error) return Promise.reject(_error);
      return Promise.resolve(_result);
    }),
    __setSignInResult: (r: Record<string, unknown>) => {
      _result = r;
      _error = null;
    },
    __setSignInError: (e: Error) => {
      _error = e;
      _result = null;
    },
  };
});

vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({ currentUser: null })),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

async function setGoogleResult(result: Record<string, unknown>) {
  const mod = await import('firebase/auth');
  (mod as unknown as { __setSignInResult: (r: Record<string, unknown>) => void }).__setSignInResult(
    result,
  );
}

async function setGoogleError(error: Error) {
  const mod = await import('firebase/auth');
  (mod as unknown as { __setSignInError: (e: Error) => void }).__setSignInError(error);
}

beforeEach(async () => {
  vi.clearAllMocks();
  const { useAuthStore } = await import('../model/useAuthStore');
  useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
});

describe('GoogleSignInButton', () => {
  it('renders the button with correct label', async () => {
    await setGoogleResult({
      user: { email: 'g@g.com', displayName: 'G', getIdToken: () => Promise.resolve('tok') },
    });
    const { GoogleSignInButton } = await import('./GoogleSignInButton');
    render(
      <I18nextProvider i18n={i18n}>
        <GoogleSignInButton />
      </I18nextProvider>,
    );
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('calls onSuccess callback after successful sign-in', async () => {
    await setGoogleResult({
      user: { email: 'g@g.com', displayName: 'G', getIdToken: () => Promise.resolve('tok') },
    });
    const onSuccess = vi.fn();
    const { GoogleSignInButton } = await import('./GoogleSignInButton');
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <GoogleSignInButton onSuccess={onSuccess} />
      </I18nextProvider>,
    );
    await user.click(screen.getByRole('button', { name: /sign in with google/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('shows popup-blocked toast when auth/popup-blocked is thrown', async () => {
    const err = Object.assign(new Error('Popup blocked'), { code: 'auth/popup-blocked' });
    await setGoogleError(err);
    const { toast } = await import('sonner');
    const { GoogleSignInButton } = await import('./GoogleSignInButton');
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <GoogleSignInButton />
      </I18nextProvider>,
    );
    await user.click(screen.getByRole('button', { name: /sign in with google/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('shows generic error toast for other Google sign-in errors', async () => {
    await setGoogleError(new Error('network error'));
    const { toast } = await import('sonner');
    const { GoogleSignInButton } = await import('./GoogleSignInButton');
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <GoogleSignInButton />
      </I18nextProvider>,
    );
    await user.click(screen.getByRole('button', { name: /sign in with google/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
