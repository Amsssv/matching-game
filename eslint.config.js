import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['e2e/**/*.{ts,tsx}'],
    rules: {
      // Playwright's page.evaluate returns unknown/any from the browser context.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // ── Layer boundaries: import only downward ──
  {
    files: ['src/ui/ui/**/*.{ts,tsx}', 'src/ui/hooks/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [
      { group: ['@features', '@features/**', '@widgets', '@widgets/**'],
        message: 'shared (ui/hooks) cannot import features/widgets — downward only.' },
    ] }] },
  },
  {
    files: ['src/ui/features/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [
      { group: ['@widgets', '@widgets/**'],
        message: 'features cannot import widgets — downward only.' },
    ] }] },
  },
  {
    files: ['src/state/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [
      { group: ['@ui', '@ui/**', '@features', '@features/**', '@widgets', '@widgets/**', '@hooks', '@hooks/**'],
        message: '@state is the core — it must not import UI layers.' },
    ] }] },
  },
])
