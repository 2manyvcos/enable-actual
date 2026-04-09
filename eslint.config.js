import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-plugin-prettier/recommended';
import unusedImports from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  globalIgnores(['client/dist']),
  {
    files: ['client/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier,
    ],
    settings: {
      'import/resolver': {
        typescript: true,
        alias: {
          extensions: ['.ts', '.tsx'],
          map: [['@', './client/src']],
          map: [['@schema', './schema']],
        },
      },
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['server/**/*.ts', 'schema/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended, prettier],
    settings: {
      'import/resolver': {
        typescript: true,
      },
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/extensions': ['error', 'always'],
    },
  },
  {
    files: ['client/**/*.{ts,tsx}', 'server/**/*.ts', 'schema/**/*.ts'],
    plugins: {
      'unused-imports': unusedImports,
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'arrow-body-style': 'error',
      'unused-imports/no-unused-imports': 'error',
      'import/no-unresolved': 'error',
      'import/no-duplicates': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            ['sibling', 'index'],
          ],
          alphabetize: { order: 'asc', orderImportKind: 'asc' },
          'newlines-between': 'never',
        },
      ],
      'import/newline-after-import': 'error',
    },
  },
]);
