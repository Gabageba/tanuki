import base from './base.js';
import globals from 'globals';

export default [
  ...base,
  {
    files: ['**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
];
