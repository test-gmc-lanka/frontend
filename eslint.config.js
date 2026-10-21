// Airbnb-aligned rules on ESLint 9 flat config (eslint-config-airbnb does not support flat config).
// Formatting is left to Prettier; eslint-config-prettier turns off conflicting rules.
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  jsxA11y.flatConfigs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { node: { extensions: ['.js', '.jsx'] } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Existing data-loading and reset effects update component state intentionally.
      // Keep the React Compiler advisory visible without failing CI for those patterns.
      'react-hooks/set-state-in-effect': 'warn',
      'react/prop-types': 'off',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'import/no-duplicates': 'error',
      'import/first': 'error',
      // Existing pages have unlinked <label>s and clickable modal overlays; kept as warnings until
      // the accessibility clean-up ticket is done, then switch back to errors.
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['*.config.js'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // vite and vitest only expose ESM "exports", which eslint-plugin-import's node resolver cannot follow
      'import/no-unresolved': ['error', { ignore: ['^vite$', '^vitest/config$', '^@vitejs/plugin-react$'] }],
      'no-console': 'off',
    },
  },
  prettier,
];
