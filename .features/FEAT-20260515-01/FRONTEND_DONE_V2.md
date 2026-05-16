---
completed_at: 2026-05-15T16:30:00Z
agent: developer-frontend
pass: v2
---

# Frontend Done V2 — Per-client company profile

## What was done

### Deleted (first-pass CompanyProfile global settings)
- `src/features/settings/api/companyProfileApi.ts` + `.test.ts`
- `src/features/settings/api/useCompanyProfile.ts` + `.test.ts`
- `src/features/settings/model/companySchema.ts` + `.test.ts`
- `src/features/settings/ui/CompanyProfilePage.tsx` + `.test.tsx`
- `src/pages/CompanyProfilePage.tsx` + `.test.tsx`

### Updated
- `src/app/App.tsx` — removed `/settings/company` route
- `src/shared/components/Sidebar.tsx` — removed Company Profile nav item; removed `Building2` import
- `src/shared/components/Sidebar.test.tsx` — replaced company-profile assertions with a negative assertion
- `src/features/clients/model/types.ts` — added 6 company fields to `Client`, `CreateClient`, `UpdateClient` interfaces
- `src/features/clients/model/schema.ts` — added 6 optional company field validators to `createClientSchema`
- `src/features/clients/ui/ClientForm.tsx` — added "Your company details for this client" section with all 6 fields
- `src/features/clients/ui/ClientForm.test.tsx` — rewrote using `data-testid` selectors; added coverage tests for all 6 company fields
- `src/features/clients/ui/ClientsPage.test.tsx` — fixed `getByLabelText(/name/i)` → `getByTestId('input-name')`
- `src/features/clients/ui/ClientFormSheet.test.tsx` — added 6 company fields to `mockClient` fixture
- `src/features/clients/model/derive.test.ts` — added 6 company fields to `makeClient` helper
- `src/mocks/handlers.ts` — removed `companyProfileApi` import; added inline `CompanyProfile` type; added `DEFAULT_COMPANY_FIELDS` constant; all client fixtures include the 6 company fields
- `src/shared/locales/en.json` — added `clients.form.companySection` and 6 field label keys

### Pre-existing lint fixes (opportunistic)
- `src/features/invoices/ui/InvoiceForm.tsx` — removed unnecessary `!` assertion (line 132)
- `src/features/invoices/ui/StatusBadge.tsx` — removed unnecessary `!` assertion (line 19)
- `src/features/invoices/ui/InvoiceForm.test.tsx` — removed unnecessary type assertions; fixed two `async` functions without `await`
- `src/features/invoices/ui/InvoiceFormSheet.test.tsx` — removed unnecessary type assertion
- `src/features/dashboard/ui/DashboardPage.test.tsx` — suppressed `no-unsafe-assignment` on the intentional `as any` cast with eslint-disable comment

## Quality gates

| Gate | Result |
|---|---|
| `pnpm test:coverage` | 760 tests passed, 0 failed |
| Statements | 99.79% (threshold 90%) |
| Branches | 95.82% (threshold 90%) |
| Functions | 96.00% (threshold 90%) |
| Lines | 99.79% (threshold 90%) |
| `pnpm build` | exit 0 (built in ~19s) |
| `pnpm lint` | exit 0 (3 pre-existing warnings, 0 errors) |
