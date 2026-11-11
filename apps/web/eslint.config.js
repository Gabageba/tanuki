import react from '@tanuki/eslint-config/react';

export default [
  ...react,
  {
    files: ['e2e/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './tsconfig.e2e.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Сервис-воркер — отдельная среда (WebWorker вместо DOM) со своим tsconfig.sw.json; в проект
  // линта он не входит, типы ему проверяет `pnpm typecheck`.
  {
    ignores: [
      'src/sw/**',
      'storybook-static/**',
      '.storybook/public/**',
      'e2e/report/**',
      'e2e/test-results/**',
    ],
  },
  // .storybook собирает провайдеры приложения — как и app, это верхний слой FSD.
  { files: ['.storybook/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': 'off' } },
  // Истории экспортируют объекты историй, а не компоненты — Fast Refresh тут ни при чём.
  { files: ['**/*.stories.tsx'], rules: { 'react-refresh/only-export-components': 'off' } },
];
