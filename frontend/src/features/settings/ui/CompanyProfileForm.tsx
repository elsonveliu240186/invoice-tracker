import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/FormField';
import { companyProfileSchema, type CompanyProfileFormValues } from '../model/companyProfileSchema';

interface CompanyProfileFormProps {
  defaultValues?: Partial<CompanyProfileFormValues>;
  onSubmit: (data: CompanyProfileFormValues) => Promise<void>;
}

function errorProp(msg: string | undefined): { error: string } | Record<string, never> {
  return msg ? { error: msg } : {};
}

export function CompanyProfileForm({ defaultValues, onSubmit }: CompanyProfileFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      vatNumber: '',
      iban: '',
      swiftBic: '',
      bankName: '',
      ...defaultValues,
    },
  });

  async function handleFormSubmit(data: CompanyProfileFormValues) {
    await onSubmit(data);
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(handleFormSubmit)(e);
      }}
      noValidate
      data-testid="company-profile-form"
      className="space-y-4"
    >
      <FormField
        id="company-name"
        label={t('settings.company.fields.name')}
        required
        {...errorProp(errors.name?.message)}
      >
        <Input
          id="company-name"
          data-testid="input-name"
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={errors.name ? 'company-name-error' : undefined}
          disabled={isSubmitting}
          {...register('name')}
        />
      </FormField>

      <FormField
        id="company-email"
        label={t('settings.company.fields.email')}
        {...errorProp(errors.email?.message)}
      >
        <Input
          id="company-email"
          type="email"
          data-testid="input-email"
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={errors.email ? 'company-email-error' : undefined}
          disabled={isSubmitting}
          {...register('email')}
        />
      </FormField>

      <FormField
        id="company-phone"
        label={t('settings.company.fields.phone')}
        {...errorProp(errors.phone?.message)}
      >
        <Input
          id="company-phone"
          data-testid="input-phone"
          aria-invalid={errors.phone ? 'true' : undefined}
          aria-describedby={errors.phone ? 'company-phone-error' : undefined}
          disabled={isSubmitting}
          {...register('phone')}
        />
      </FormField>

      <FormField
        id="company-address"
        label={t('settings.company.fields.address')}
        {...errorProp(errors.address?.message)}
      >
        <Input
          id="company-address"
          data-testid="input-address"
          aria-invalid={errors.address ? 'true' : undefined}
          aria-describedby={errors.address ? 'company-address-error' : undefined}
          disabled={isSubmitting}
          {...register('address')}
        />
      </FormField>

      <FormField
        id="company-vatNumber"
        label={t('settings.company.fields.vatNumber')}
        {...errorProp(errors.vatNumber?.message)}
      >
        <Input
          id="company-vatNumber"
          data-testid="input-vatNumber"
          aria-invalid={errors.vatNumber ? 'true' : undefined}
          aria-describedby={errors.vatNumber ? 'company-vatNumber-error' : undefined}
          disabled={isSubmitting}
          {...register('vatNumber')}
        />
      </FormField>

      <FormField
        id="company-iban"
        label={t('settings.company.fields.iban')}
        {...errorProp(errors.iban?.message)}
      >
        <Input
          id="company-iban"
          data-testid="input-iban"
          aria-invalid={errors.iban ? 'true' : undefined}
          aria-describedby={errors.iban ? 'company-iban-error' : undefined}
          disabled={isSubmitting}
          {...register('iban')}
        />
      </FormField>

      <FormField
        id="company-swiftBic"
        label={t('settings.company.fields.swiftBic')}
        {...errorProp(errors.swiftBic?.message)}
      >
        <Input
          id="company-swiftBic"
          data-testid="input-swiftBic"
          aria-invalid={errors.swiftBic ? 'true' : undefined}
          aria-describedby={errors.swiftBic ? 'company-swiftBic-error' : undefined}
          disabled={isSubmitting}
          {...register('swiftBic')}
        />
      </FormField>

      <FormField
        id="company-bankName"
        label={t('settings.company.fields.bankName')}
        {...errorProp(errors.bankName?.message)}
      >
        <Input
          id="company-bankName"
          data-testid="input-bankName"
          aria-invalid={errors.bankName ? 'true' : undefined}
          aria-describedby={errors.bankName ? 'company-bankName-error' : undefined}
          disabled={isSubmitting}
          {...register('bankName')}
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting} data-testid="btn-save-company-profile">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            {t('common.saving')}
          </>
        ) : (
          t('common.save')
        )}
      </Button>
    </form>
  );
}
