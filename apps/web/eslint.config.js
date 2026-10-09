import react from '@tanuki/eslint-config/react';

export default [
  ...react,
  // Сервис-воркер — отдельная среда (WebWorker вместо DOM) со своим tsconfig.sw.json; в проект
  // линта он не входит, типы ему проверяет `pnpm typecheck`.
  { ignores: ['src/sw/**'] },
];
