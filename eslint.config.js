import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'dist-ssr']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.strict, reactHooks.configs.flat.recommended],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Three.js scene code is imperative by design: objects are created once and
    // mutated every frame inside useFrame (the documented R3F pattern). The React
    // Compiler purity/immutability rules assume immutable render data, so they are
    // relaxed here only. Everything else in the app keeps them.
    files: ['src/features/experience/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/globals': 'off',
    },
  },
  {
    files: ['vite.config.ts', 'config/**/*.ts', 'scripts/**/*.ts', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
