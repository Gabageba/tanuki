import { defineConfig, devices } from '@playwright/test';
import { PORT } from './models';

const IS_CI = !!process.env.CI;

/**
 * Визуальные тесты: каждая история собранного Storybook снимается в обеих темах и сравнивается
 * с эталоном из `__screenshots__`. Запускать только через `pnpm test:visual` — в Linux-образе
 * Playwright, том же, что в CI: на macOS шрифты сглаживаются иначе, эталоны бы не сошлись.
 */
export default defineConfig({
  testDir: '.',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: IS_CI,
  reporter: IS_CI
    ? [['github'], ['html', { outputFolder: './report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: './report', open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      // Шум сглаживания между прогонами; реальная правка вёрстки задевает заметно больше.
      maxDiffPixelRatio: 0.001,
    },
  },
  webServer: {
    command: 'node serve.ts',
    url: `http://127.0.0.1:${PORT}/index.json`,
    reuseExistingServer: !IS_CI,
  },
});
