import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      globalSetup: ['./src/vitest.global-setup.ts'],
      setupFiles: ['./src/test-setup.ts'],
      css: false,
      exclude: ['**/node_modules/**', '**/dist/**', 'tests/**/*.spec.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        thresholds: {
          lines: 95,
          functions: 95,
          statements: 95,
          branches: 90,
        },
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/test-setup.ts',
          'src/vitest.global-setup.ts',
          'src/main.tsx',
          'src/shared/api/mocks/**',
          'src/mocks/**',
          'src/**/*.d.ts',
          'src/**/types.ts',
          'src/**/model/artifact.ts',
          // Vendored shadcn/ui primitives — pure presentational wrappers around Radix
          'src/shared/ui/button.tsx',
          'src/shared/ui/input.tsx',
          'src/shared/ui/card.tsx',
          'src/shared/ui/badge.tsx',
          'src/shared/ui/dialog.tsx',
          'src/shared/ui/table.tsx',
          'src/shared/ui/skeleton.tsx',
          'src/shared/ui/sonner.tsx',
          'src/shared/ui/dropdown-menu.tsx',
          'src/shared/ui/avatar.tsx',
          'src/shared/ui/separator.tsx',
          // Additional shadcn/Radix primitive wrappers and utility UI atoms
          'src/shared/ui/sheet.tsx',
          // Pure TypeScript interface files (no runtime code, v8 reports 0% correctly)
          'src/features/settings/model/companyProfile.ts',
        ],
      },
    },
  }),
);
