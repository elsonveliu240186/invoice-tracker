# Dashboard and core UI modernization

Modernise the main application UI: dashboard, navigation, and the existing Clients feature pages.

Requirements:
- Modern sidebar navigation: collapsible, icon + label, active state, mobile drawer variant
- Top navigation bar: breadcrumbs, user avatar/dropdown (profile, logout), theme toggle, language selector
- Dashboard home page: KPI summary cards (total clients, active clients, invoices — stubs for now), recent activity feed stub
- Clients list page: redesign with shadcn/ui Table or data grid, search/filter bar, pagination, row actions (edit, delete)
- Client create/edit: redesign form in a Dialog/Sheet using react-hook-form + zod
- Client detail page: card layout, contact info, status badge, action buttons
- Skeleton loaders for all async data states
- Empty state illustrations/components for zero-data views
- Responsive across mobile (bottom nav or hamburger), tablet, desktop
- Smooth Framer Motion transitions between pages and on list items
- All existing Client API calls (GET /api/v1/clients, POST, PUT, DELETE) must continue to work — this is a UI-only modernisation
- i18n: all new strings externalised to en.json
- Depends on FEAT-20260512-01 (design system) and FEAT-20260512-02 (auth/layout shell) being merged first
