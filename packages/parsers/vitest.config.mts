import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'contract',
          include: ['contract/**/*.test.ts'],
          // Один HTTP-запрос с повторами соединения может занять больше 30 секунд.
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
