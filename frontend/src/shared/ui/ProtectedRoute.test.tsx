import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
}));
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({})),
}));

beforeEach(async () => {
  localStorage.clear();
  const { useAuthStore } = await import('@/features/auth/model/useAuthStore');
  useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
});

async function renderWithAuth(authenticated: boolean, initialPath = '/protected') {
  const { useAuthStore } = await import('@/features/auth/model/useAuthStore');
  if (authenticated) {
    useAuthStore.setState({
      user: { email: 'u@e.com', displayName: 'U', provider: 'password' },
      status: 'authenticated',
    });
  } else {
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
  }
  const { ProtectedRoute } = await import('./ProtectedRoute');
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<p>Protected content</p>} />
        </Route>
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function LoginCapture({ onState }: { onState: (s: unknown) => void }) {
  const location = useLocation();
  onState(location.state);
  return <p>Login page</p>;
}

describe('ProtectedRoute', () => {
  it('renders outlet content when authenticated', async () => {
    await renderWithAuth(true);
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', async () => {
    await renderWithAuth(false);
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('preserves the original location in state.from', async () => {
    const { useAuthStore } = await import('@/features/auth/model/useAuthStore');
    useAuthStore.setState({ user: null, status: 'unauthenticated' });

    let capturedState: unknown = null;
    const { ProtectedRoute } = await import('./ProtectedRoute');

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<p>Protected content</p>} />
          </Route>
          <Route
            path="/login"
            element={
              <LoginCapture
                onState={(s) => {
                  capturedState = s;
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(capturedState).toBeTruthy();
  });
});
