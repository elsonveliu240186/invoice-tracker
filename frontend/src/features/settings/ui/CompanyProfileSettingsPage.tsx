import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { useCompanyProfile } from '../api/useCompanyProfile';
import { updateCompanyProfile } from '../api/companyProfileApi';
import { CompanyProfileForm } from './CompanyProfileForm';
import type { CompanyProfileFormValues } from '../model/companyProfileSchema';
import type { CompanyProfile } from '../model/companyProfile';

function toFormDefaults(data: CompanyProfile): Partial<CompanyProfileFormValues> {
  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    vatNumber: data.vatNumber,
    iban: data.iban,
    swiftBic: data.swiftBic,
    bankName: data.bankName,
  };
}

export function CompanyProfileSettingsPage() {
  const { t } = useTranslation();
  const { data, loading, refetch } = useCompanyProfile();

  async function handleSave(values: CompanyProfileFormValues) {
    try {
      await updateCompanyProfile({
        name: values.name,
        email: values.email ?? '',
        phone: values.phone ?? '',
        address: values.address ?? '',
        vatNumber: values.vatNumber ?? '',
        iban: values.iban ?? '',
        swiftBic: values.swiftBic ?? '',
        bankName: values.bankName ?? '',
      });
      toast.success(t('settings.company.toast.saved'));
      refetch();
    } catch {
      toast.error(t('errors.boundary.body'));
    }
  }

  return (
    <div data-testid="company-profile-settings-page">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-foreground)]">
        {t('settings.company.title')}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.company.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div data-testid="company-profile-loading" className="space-y-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          )}

          {!loading && data !== null && (
            <CompanyProfileForm defaultValues={toFormDefaults(data)} onSubmit={handleSave} />
          )}

          {!loading && data === null && (
            <CompanyProfileForm onSubmit={handleSave} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
