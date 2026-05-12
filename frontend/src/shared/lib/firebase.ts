import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

function getFirebaseConfig() {
  // Use type assertion to access Vite env vars — they are injected at build time.
  const env = import.meta.env as Record<string, string | undefined>;

  const apiKey = env['VITE_FIREBASE_API_KEY'];
  if (!apiKey) {
    throw new Error(
      'VITE_FIREBASE_API_KEY is not set. ' +
        'Copy .env.example to .env.local and fill in your Firebase project values.',
    );
  }

  return {
    apiKey,
    ...(env['VITE_FIREBASE_AUTH_DOMAIN'] && { authDomain: env['VITE_FIREBASE_AUTH_DOMAIN'] }),
    ...(env['VITE_FIREBASE_PROJECT_ID'] && { projectId: env['VITE_FIREBASE_PROJECT_ID'] }),
    ...(env['VITE_FIREBASE_STORAGE_BUCKET'] && {
      storageBucket: env['VITE_FIREBASE_STORAGE_BUCKET'],
    }),
    ...(env['VITE_FIREBASE_MESSAGING_SENDER_ID'] && {
      messagingSenderId: env['VITE_FIREBASE_MESSAGING_SENDER_ID'],
    }),
    ...(env['VITE_FIREBASE_APP_ID'] && { appId: env['VITE_FIREBASE_APP_ID'] }),
  };
}

export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  const existing = getApps();
  if (existing.length > 0 && existing[0]) {
    _app = existing[0];
    return _app;
  }
  _app = initializeApp(getFirebaseConfig());
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());
  return _auth;
}

/** Reset singletons — used in tests only. */
export function _resetFirebaseSingletons(): void {
  _app = null;
  _auth = null;
}
