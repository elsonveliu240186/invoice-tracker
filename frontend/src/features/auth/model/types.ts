export type AuthProvider = 'password' | 'google';

export interface AuthSession {
  email: string;
  displayName: string;
  provider: AuthProvider;
  /** base64(email:password) — only for provider='password' */
  basicAuthToken?: string;
  /** Firebase ID token — only for provider='google' */
  idToken?: string;
  /** Expiry ms epoch — used to drop expired tokens on hydrate */
  expiresAt?: number;
}

export type AuthStatus = 'idle' | 'pending' | 'authenticated' | 'unauthenticated';
