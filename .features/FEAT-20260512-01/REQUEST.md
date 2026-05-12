# Frontend design system

Create a scalable frontend design system as the foundation for a complete UI modernisation.

Requirements:
- Set up Tailwind CSS v4 as the primary styling solution (already installed, needs v4 config with CSS-first approach)
- Integrate shadcn/ui component library (Button, Input, Card, Badge, Dialog, Table, Skeleton, Toast/Sonner, Dropdown, Avatar, Separator)
- Implement full dark mode and light mode with persistent user preference (localStorage + system default)
- Create centralized theme management via Zustand store
- Integrate Framer Motion for shared animation primitives (page transitions, fade-in, slide-up, skeleton pulse)
- Establish design tokens: color palette, typography scale (Inter font), spacing, border-radius, shadow levels
- Create shared layout components: AppShell, Sidebar, TopNav, PageHeader, PageContainer
- Create shared UI components: ThemeToggle, LanguageSelector (stub), LoadingSpinner, EmptyState, ErrorBoundary
- Set up react-i18next with English as default locale, ready for additional languages
- Follow accessibility best practices (ARIA labels, focus management, keyboard navigation, color contrast)
- Design inspiration: Linear, Stripe, Vercel, Supabase — clean, modern SaaS aesthetic
- Responsive: mobile, tablet, desktop breakpoints
- Maintainable feature-sliced folder structure: src/shared/ui, src/shared/lib, src/shared/theme
