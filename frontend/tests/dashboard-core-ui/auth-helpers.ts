/**
 * Auth helpers for E2E tests.
 *
 * The app uses Zustand with `persist` middleware, writing to localStorage under
 * the key "it.auth". We inject a synthetic authenticated session so tests do not
 * have to drive the login form against a real Firebase/backend auth flow.
 */
import type { Page } from '@playwright/test';

const AUTH_STORAGE_KEY = 'it.auth';

interface AuthSession {
  email: string;
  displayName: string;
  provider: 'password';
  basicAuthToken: string;
}

/**
 * Injects a valid auth session into localStorage then navigates to the given
 * path. After navigation the Zustand store will hydrate from localStorage and
 * treat the user as authenticated.
 */
export async function loginAs(
  page: Page,
  options: {
    email?: string;
    password?: string;
    displayName?: string;
    navigateTo?: string;
  } = {},
): Promise<void> {
  const {
    email = 'admin',
    password = 'secret',
    displayName = 'Admin User',
    navigateTo = '/',
  } = options;

  const basicAuthToken = Buffer.from(`${email}:${password}`).toString('base64');

  const session: AuthSession = {
    email,
    displayName,
    provider: 'password',
    basicAuthToken,
  };

  // The Zustand `persist` shape wraps the state under a `state` key with a `version`.
  const persistedValue = JSON.stringify({ state: { user: session }, version: 0 });

  // Navigate to blank page first so localStorage is in the right origin.
  await page.goto('/login');
  await page.evaluate(
    ({ key, value }: { key: string; value: string }) => {
      localStorage.setItem(key, value);
    },
    { key: AUTH_STORAGE_KEY, value: persistedValue },
  );

  // Now navigate to the target route — the ProtectedRoute will see status=authenticated.
  await page.goto(navigateTo);
}

/**
 * Seeds clients via the real backend API using HTTP Basic auth.
 * Cleans existing data and creates the provided clients.
 */
export async function seedClients(
  request: import('@playwright/test').APIRequestContext,
  clients: Array<{
    name: string;
    email: string;
    phone?: string;
    address?: string;
  }>,
): Promise<void> {
  const basicAuth = 'Basic ' + Buffer.from('admin:secret').toString('base64');

  // Fetch existing clients and delete them
  const listResp = await request.get('http://localhost:8080/api/v1/clients?size=100', {
    headers: { Authorization: basicAuth },
  });
  const page = (await listResp.json()) as { content: { id: string }[] };
  for (const c of page.content) {
    await request.delete(`http://localhost:8080/api/v1/clients/${c.id}`, {
      headers: { Authorization: basicAuth },
    });
  }

  // Create fresh clients
  for (const client of clients) {
    await request.post('http://localhost:8080/api/v1/clients', {
      headers: { Authorization: basicAuth, 'Content-Type': 'application/json' },
      data: client,
    });
  }
}
