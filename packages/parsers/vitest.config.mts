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
          testTimeout: 30_000,
        },
      },
    ],
  },
});
