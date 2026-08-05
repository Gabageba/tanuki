import node from '@tanuki/eslint-config/node';

export default [
  ...node,
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
  {
    // scripts/ is a standalone CLI tool (run via `tsx`, never imported by the published
    // package), so its playwright dependency belongs in devDependencies without pulling a
    // browser automation lib into every consumer's install.
    files: ['scripts/**/*.ts'],
    rules: {
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
];
