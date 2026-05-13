import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth } from '@/shared/lib/firebase';
import { loginRequest, registerRequest, forgotPasswordRequest } from '../api/authApi';
import type { AuthSession, AuthStatus } from './types';

const STORAGE_KEY = 'it.auth';

interface AuthState {
  user: AuthSession | null;
  status: AuthStatus;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
  setSession: (session: AuthSession) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: 'unauthenticated',
      error: null,

      setSession: (session: AuthSession) => {
        set({ user: session, status: 'authenticated', error: null });
      },

      clearError: () => set({ error: null }),

      login: async (email: string, password: string) => {
        set({ status: 'pending', error: null });
        try {
          const response = await loginRequest({ email, password });
          const basicAuthToken = btoa(`${email}:${password}`);
          const session: AuthSession = {
            email: response.email,
            displayName: response.displayName,
            provider: 'password',
            basicAuthToken,
          };
          set({ user: session, status: 'authenticated', error: null });
        } catch (err) {
          set({ status: 'unauthenticated', error: (err as Error).message });
          throw err;
        }
      },

      loginWithGoogle: async () => {
        set({ status: 'pending', error: null });
        try {
          const auth = getFirebaseAuth();
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          const idToken = await result.user.getIdToken();
          const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
          const session: AuthSession = {
            email: result.user.email ?? '',
            displayName: result.user.displayName ?? result.user.email ?? '',
            provider: 'google',
            idToken,
            expiresAt,
          };
          set({ user: session, status: 'authenticated', error: null });
        } catch (err) {
          set({ status: 'unauthenticated', error: (err as Error).message });
          throw err;
        }
      },

      register: async (displayName: string, email: string, password: string) => {
        set({ status: 'pending', error: null });
        try {
          await registerRequest({ displayName, email, password });
          set({ status: 'unauthenticated', error: null });
        } catch (err) {
          set({ status: 'unauthenticated', error: (err as Error).message });
          throw err;
        }
      },

      forgotPassword: async (email: string) => {
        set({ status: 'pending', error: null });
        try {
          await forgotPasswordRequest({ email });
          set({ status: 'unauthenticated', error: null });
        } catch {
          // Anti-enumeration: always treat as success
          set({ status: 'unauthenticated', error: null });
        }
      },

      logout: () => {
        set({ user: null, status: 'unauthenticated', error: null });
        // Persist middleware will sync this to localStorage
      },

      hydrate: () => {
        const { user } = get();
        if (!user) {
          set({ status: 'unauthenticated' });
          return;
        }
        // Drop expired Google tokens
        if (user.provider === 'google' && user.expiresAt && user.expiresAt < Date.now()) {
          set({ user: null, status: 'unauthenticated' });
          return;
        }
        set({ status: 'authenticated' });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
