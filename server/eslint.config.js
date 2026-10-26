import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|next|req|res' }],
      'no-console': 'warn',
    },
  },
  { ignores: ['node_modules', 'logs', 'coverage'] },
];
