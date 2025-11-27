// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/**',
      'expo/**',
      'android/**',
      'ios/**',
      'node_modules/**',
      'web-build/**',
      'docs/**',
      'tests/**',
      'supabase/**',
      'google-service-key.json',
      '.expo/**',
    ],
  },
  {
    files: ['__tests__/**/*'],
    languageOptions: {
      globals: {
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
  },
]);
