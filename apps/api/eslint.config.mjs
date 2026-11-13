import node from '@tanuki/eslint-config/node';

export default [
  ...node,
  { ignores: ['dist-cli/**', 'dist-e2e/**'] },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
