# Authentication modernization

Modernise the authentication experience with a production-quality login/register flow.

Requirements:
- Dedicated Login page with email/password form and Google OAuth button
- Dedicated Register page with name, email, password, confirm-password fields
- Forgot Password page / flow (request reset email)
- Form validation using react-hook-form + zod schemas
- Loading states, error states, success notifications (Sonner toasts)
- Protected route support: redirect unauthenticated users to /login, redirect authenticated users away from /login
- Session persistence: store auth token in localStorage/sessionStorage, rehydrate on reload
- Logout support
- Google OAuth integration (use Firebase Auth as the provider; configure via environment variables VITE_FIREBASE_*)
- The backend already uses HTTP Basic auth — the frontend login should call POST /api/v1/auth/login (or adapt to the existing Spring Security endpoint) and store the token/credentials
- Modern authentication landing experience: split-panel layout (branding on left, form on right on desktop; stacked on mobile)
- Smooth page transitions using Framer Motion
- Uses shadcn/ui form components, inputs, buttons established in FEAT-20260512-01
- i18n: all strings externalised to en.json locale file

Note: Google OAuth + Firebase Auth require environment variables. Document required vars in .env.example. Backend does not need changes for Google OAuth in this feature — the frontend handles OAuth token exchange and falls back to Basic auth for non-OAuth users.
