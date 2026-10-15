import react from '@tanuki/eslint-config/react';

export default [
  ...react,
  // Сервис-воркер — отдельная среда (WebWorker вместо DOM) со своим tsconfig.sw.json; в проект
  // линта он не входит, типы ему проверяет `pnpm typecheck`.
  { ignores: ['src/sw/**', 'storybook-static/**', '.storybook/public/**'] },
  // .storybook собирает провайдеры приложения — как и app, это верхний слой FSD.
  { files: ['.storybook/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': 'off' } },
  // Истории экспортируют объекты историй, а не компоненты — Fast Refresh тут ни при чём.
  { files: ['**/*.stories.tsx'], rules: { 'react-refresh/only-export-components': 'off' } },
];
