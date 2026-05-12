import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

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

async function renderWithAuth(authenticated: boolean, initialPath = '/login') {
  const { useAuthStore } = await import('@/features/auth/model/useAuthStore');
  if (authenticated) {
    useAuthStore.setState({
      user: { email: 'u@e.com', displayName: 'U', provider: 'password' },
      status: 'authenticated',
    });
  } else {
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
  }
  const { PublicOnlyRoute } = await import('./PublicOnlyRoute');
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<p>Login form</p>} />
          <Route path="/register" element={<p>Register form</p>} />
        </Route>
        <Route path="/" element={<p>Home page</p>} />
        <Route path="/dashboard" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PublicOnlyRoute', () => {
  it('renders outlet content when unauthenticated', async () => {
    await renderWithAuth(false);
    expect(screen.getByText('Login form')).toBeInTheDocument();
  });

  it('redirects authenticated user to / by default', async () => {
    await renderWithAuth(true);
    expect(screen.queryByText('Login form')).not.toBeInTheDocument();
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('redirects authenticated user to state.from when present', async () => {
    const { useAuthStore } = await import('@/features/auth/model/useAuthStore');
    useAuthStore.setState({
      user: { email: 'u@e.com', displayName: 'U', provider: 'password' },
      status: 'authenticated',
    });
    const { PublicOnlyRoute } = await import('./PublicOnlyRoute');
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/login', state: { from: { pathname: '/dashboard' } } }]}
      >
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<p>Login form</p>} />
          </Route>
          <Route path="/dashboard" element={<p>Dashboard</p>} />
          <Route path="/" element={<p>Home page</p>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
