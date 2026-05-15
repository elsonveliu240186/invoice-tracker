import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules', '**/*.d.ts'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      // AC-8: Ban raw Tailwind colour utilities — use CSS token equivalents instead.
      // e.g. use text-[var(--color-destructive)] instead of text-red-500/600/700
      //      use text-[var(--color-muted-foreground)] instead of text-muted-foreground literal
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/\\btext-red-/]',
          message:
            'Use text-[var(--color-destructive)] instead of hard-coded text-red-* utilities.',
        },
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/\\bbg-red-/]',
          message:
            'Use bg-[var(--color-destructive)]/10 instead of hard-coded bg-red-* utilities.',
        },
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/\\btext-black\\b/]',
          message: 'Use text-[var(--color-foreground)] instead of text-black.',
        },
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/\\btext-gray-/]',
          message:
            'Use text-[var(--color-muted-foreground)] instead of hard-coded text-gray-* utilities.',
        },
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/\\btext-white\\b/]',
          message: 'Use a CSS token colour instead of hard-coded text-white.',
        },
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/(?<![\\w-])text-foreground(?![\\w-])/]',
          message:
            'Use text-[var(--color-foreground)] instead of the bare text-foreground utility.',
        },
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/(?<![\\w-])text-muted-foreground(?![\\w-])/]',
          message:
            'Use text-[var(--color-muted-foreground)] instead of the bare text-muted-foreground utility.',
        },
      ],
    },
  },
);
