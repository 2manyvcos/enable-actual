/* eslint-disable import-x/no-named-as-default-member */

import js from '@eslint/js';
import { importX } from 'eslint-plugin-import-x';
import prettier from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['client/dist']),
  js.configs.recommended,
  tseslint.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  prettier,
  {
    files: ['client/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite()],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.browser,
    },
  },
  {
    files: ['server/**/*.ts', 'shared/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'import-x/extensions': ['error', 'always'],
      'import-x/no-named-as-default-member': 'off',
    },
  },
  {
    files: ['client/**/*.{ts,tsx}', 'server/**/*.ts', 'shared/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          enableAutofixRemoval: { imports: true },
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'preserve-caught-error': 'off',
    },
  },
]);
