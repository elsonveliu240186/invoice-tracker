import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { getCompanyProfile, updateCompanyProfile } from './companyProfileApi';
import { resetMockCompanyProfile } from '@/mocks/handlers';
import { ApiError } from '@/shared/lib/http';

beforeEach(() => {
  resetMockCompanyProfile();
});

const VALID_PROFILE = {
  name: 'Invoice Tracker Co',
  email: 'billing@example.com',
  phone: '+1 555 000 0000',
  address: '123 Business Ave',
  vatNumber: 'US123',
  iban: 'US12 3456',
  swiftBic: 'BOFAUS3N',
  bankName: 'Bank of Example',
};

describe('getCompanyProfile', () => {
  it('returns the company profile on 200', async () => {
    const result = await getCompanyProfile();
    expect(result).toBeDefined();
    expect(typeof result.name).toBe('string');
    expect(typeof result.updatedAt).toBe('string');
  });

  it('throws ApiError on server error', async () => {
    server.use(
      http.get('/api/v1/settings/company', () =>
        HttpResponse.json({ status: 500, detail: 'Internal error' }, { status: 500 }),
      ),
    );
    await expect(getCompanyProfile()).rejects.toBeInstanceOf(ApiError);
  });
});

describe('updateCompanyProfile', () => {
  it('returns updated payload on success', async () => {
    const result = await updateCompanyProfile(VALID_PROFILE);
    expect(result.name).toBe(VALID_PROFILE.name);
    expect(result.email).toBe(VALID_PROFILE.email);
    expect(result.vatNumber).toBe(VALID_PROFILE.vatNumber);
    expect(result.iban).toBe(VALID_PROFILE.iban);
    expect(result.swiftBic).toBe(VALID_PROFILE.swiftBic);
    expect(result.bankName).toBe(VALID_PROFILE.bankName);
    expect(typeof result.updatedAt).toBe('string');
  });

  it('throws ApiError 400 with errors[] on validation failure', async () => {
    server.use(
      http.put('/api/v1/settings/company', () =>
        HttpResponse.json(
          {
            status: 400,
            code: 'VALIDATION_FAILED',
            detail: 'Validation failed',
            errors: [{ field: 'name', message: 'must not be blank' }],
          },
          { status: 400 },
        ),
      ),
    );
    let caught: unknown;
    try {
      await updateCompanyProfile({ ...VALID_PROFILE, name: '' });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(400);
    expect((caught as ApiError).code).toBe('VALIDATION_FAILED');
  });

  it('throws ApiError on 401 unauthorized', async () => {
    server.use(
      http.put('/api/v1/settings/company', () =>
        HttpResponse.json({ status: 401, detail: 'Unauthorized' }, { status: 401 }),
      ),
    );
    await expect(updateCompanyProfile(VALID_PROFILE)).rejects.toBeInstanceOf(ApiError);
  });
});
