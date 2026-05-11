import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
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
          'src/main.tsx',
          'src/shared/api/mocks/**',
          'src/mocks/**',
          'src/**/*.d.ts',
          'src/**/types.ts',
        ],
      },
    },
  }),
);
