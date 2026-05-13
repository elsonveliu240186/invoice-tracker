import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(async () => {
  await import('./i18n');
});

describe('i18n', () => {
  it('resolves common.appName', async () => {
    const i18n = (await import('./i18n')).default;
    expect(i18n.t('common.appName')).toBe('Invoice Tracker');
  });

  it('returns the key for a missing translation', async () => {
    const i18n = (await import('./i18n')).default;
    expect(i18n.t('this.key.does.not.exist')).toBe('this.key.does.not.exist');
  });

  it('changeLanguage to en is idempotent', async () => {
    const i18n = (await import('./i18n')).default;
    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
    expect(i18n.t('common.appName')).toBe('Invoice Tracker');
  });

  it('resolves nav.clients', async () => {
    const i18n = (await import('./i18n')).default;
    expect(i18n.t('nav.clients')).toBe('Clients');
  });

  it('resolves errors.boundary.title', async () => {
    const i18n = (await import('./i18n')).default;
    expect(i18n.t('errors.boundary.title')).toBe('Something went wrong');
  });
});
