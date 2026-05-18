import { http } from '@/shared/lib/http';
import type { CompanyProfile } from '../model/companyProfile';

const BASE = '/api/v1/settings/company';

export async function getCompanyProfile(): Promise<CompanyProfile> {
  return http<CompanyProfile>(BASE);
}

export async function updateCompanyProfile(
  data: Omit<CompanyProfile, 'updatedAt'>,
): Promise<CompanyProfile> {
  return http<CompanyProfile>(BASE, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
