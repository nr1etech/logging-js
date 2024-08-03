// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const config = [
  {
    ignores: ['coverage', 'dist', 'site'],
  },
  ...tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
  ),
];
export default config;
