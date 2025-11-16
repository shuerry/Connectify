/* eslint import/no-extraneous-dependencies: "off" */

import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginImport from 'eslint-plugin-import';
import eslintReactHooks from 'eslint-plugin-react-hooks';
import eslintReactRefresh from 'eslint-plugin-react-refresh';

export default defineConfig([
  globalIgnores(['build/*', 'dist/*', '.stryker-tmp/*', 'coverage/*']),
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    extends: [
      js.configs.recommended,
      eslintPluginImport.flatConfigs.recommended,
      eslintPluginImport.flatConfigs.typescript,
    ],
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      'import/no-amd': 'error',
      'import/no-commonjs': 'error',
      'import/no-empty-named-blocks': 'error',
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.spec.*',
            '**/*.test.*',
            '**/tests/**/*',
            '**/test/**/*',
            '**/*.config.*',
            '**/setup.*',
            'vitest.config.ts',
            'eslint.config.*',
          ],
          includeInternal: true,
        },
      ],
      'import/no-import-module-exports': 'error',
      'import/no-named-as-default-member': 'off',
      'import/prefer-default-export': 'error',
      'no-console': 'error',
      'no-param-reassign': 'error',
      'no-plusplus': 'error',
      'no-throw-literal': 'error',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: tseslint.configs.recommended,
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': eslintReactHooks,
      'react-refresh': eslintReactRefresh,
    },
    rules: {
      ...eslintReactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      '@typescript-eslint/no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
  eslintPluginPrettierRecommended,
]);
