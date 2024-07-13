// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const config = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
config[0].ignores = ['coverage/**', 'dist/**', 'site/**'];
export default config;
