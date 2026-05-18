import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
// E2E smoke/regression projects need the docker stack; detect if we're running them
const isE2EProject = !!(process.env['E2E_BASE_URL'] || process.env['E2E_API_URL']);

export default defineConfig({
  testDir: './tests',
  // E2E tests share a real Postgres backend — run sequentially to avoid state conflicts
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['github'], ['html']] : 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // globalSetup only applies when running smoke/regression against real stack
  ...(isE2EProject ? { globalSetup: './tests/e2e/global-setup.ts' } : {}),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/e2e/**'],
    },
    {
      name: 'smoke',
      testDir: './tests/e2e/smoke',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8081',
        trace: 'on-first-retry',
      },
      workers: 1,
      retries: isCI ? 1 : 0,
    },
    {
      name: 'regression',
      testDir: './tests/e2e/regression',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8081',
        trace: 'on',
      },
      workers: 1,
      retries: isCI ? 1 : 0,
    },
    {
      name: 'regression-firefox',
      testDir: './tests/e2e/regression',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8081',
        trace: 'on',
      },
      workers: 1,
      retries: isCI ? 1 : 0,
    },
  ],
  ...(isCI && !isE2EProject
    ? {
        webServer: {
          command: 'pnpm preview --port 5173',
          port: 5173,
          reuseExistingServer: false,
        },
      }
    : {}),
});
