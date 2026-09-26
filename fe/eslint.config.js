import js from '@eslint/js';
import { readdirSync } from 'node:fs';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

const features = readdirSync(new URL('./src/features', import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const upperLayers = {
  group: ['**/app', '**/app/**', '**/pages', '**/pages/**'],
  message: 'Features and shared code must not depend on app or pages.',
};

export default defineConfig([
  globalIgnores(['dist', 'archive/styles', 'tests']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            upperLayers,
            {
              group: ['**/features', '**/features/**'],
              message: 'Shared code must be independent of business features.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/pages/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/*/**'],
              message: 'Import features through their public index.ts entry point.',
            },
          ],
        },
      ],
    },
  },
  ...features.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            upperLayers,
            {
              regex: `^\\.\\./(?:\\.\\./)*(?:features/)?(?:${features.filter((name) => name !== feature).join('|')})/`,
              message: 'Use another feature through its public index.ts entry point.',
            },
          ],
        },
      ],
    },
  })),
]);
