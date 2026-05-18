/**
 * Playwright globalSetup — verifies the stack is reachable and seeds the
 * default admin user (POST /api/v1/auth/register — ignores 409 Conflict).
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { request } from '@playwright/test';

const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:8082';
const MAILHOG_URL = process.env['E2E_MAILHOG_URL'] ?? 'http://localhost:8026';
const USERNAME = process.env['E2E_USERNAME'] ?? 'admin@example.com';
const PASSWORD = process.env['E2E_PASSWORD'] ?? 'Secret1!';

async function waitForUrl(
  url: string,
  label: string,
  maxAttempts = 30,
  intervalMs = 2000,
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 401 || res.status === 403) {
        console.log(`[global-setup] ${label} is reachable (status ${res.status})`);
        return;
      }
      console.log(`[global-setup] ${label} returned ${res.status}, retrying…`);
    } catch {
      console.log(`[global-setup] ${label} not yet reachable (attempt ${attempt}/${maxAttempts})`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`[global-setup] ${label} at ${url} never became reachable`);
}

export default async function globalSetup(): Promise<void> {
  // 1. Verify backend health
  await waitForUrl(`${API_URL}/actuator/health`, 'backend');

  // 2. Verify MailHog
  await waitForUrl(`${MAILHOG_URL}/api/v2/messages`, 'mailhog');

  // 3. Register admin user — ignore 409 Conflict (user already exists)
  const ctx = await request.newContext();
  try {
    const res = await ctx.post(`${API_URL}/api/v1/auth/register`, {
      data: { email: USERNAME, password: PASSWORD, displayName: 'Admin E2E' },
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok() && res.status() !== 409) {
      const body = await res.text();
      throw new Error(`[global-setup] register admin failed: ${res.status()} ${body}`);
    }
    console.log(`[global-setup] Admin user ready (status ${res.status()})`);
  } finally {
    await ctx.dispose();
  }

  // 4. Purge MailHog inbox
  try {
    await fetch(`${MAILHOG_URL}/api/v1/messages`, { method: 'DELETE' });
    console.log('[global-setup] MailHog inbox purged');
  } catch {
    console.warn('[global-setup] MailHog purge failed (non-fatal)');
  }

  // 5. Pre-generate large fixture files in a temp dir so specs can locate them
  //    without writing into the source tree (which is read-only in CI).
  const fixturesDir = path.join(os.tmpdir(), 'e2e-fixtures');
  fs.mkdirSync(fixturesDir, { recursive: true });
  const oversizedPath = path.join(fixturesDir, 'oversized-template.docx');
  if (!fs.existsSync(oversizedPath)) {
    fs.writeFileSync(oversizedPath, Buffer.alloc(6 * 1024 * 1024, 0));
    console.log('[global-setup] oversized-template.docx written to', oversizedPath);
  }
  // Expose path to specs via env var
  process.env['E2E_FIXTURES_TMP'] = fixturesDir;
}
