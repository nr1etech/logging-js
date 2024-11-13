import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const config = tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      '**/*.js',
      '**/*.d.*',
      '**/*.map',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
export default config;
