import type { StorybookConfig } from '@storybook/react-vite';
import type { PluginOption } from 'vite';

/** Плагин PWA собирает сервис-воркер приложения — Storybook он не нужен и мешает воркеру MSW. */
const isPwaPlugin = (plugin: PluginOption) =>
  !!plugin &&
  typeof plugin === 'object' &&
  'name' in plugin &&
  plugin.name.startsWith('vite-plugin-pwa');

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  framework: '@storybook/react-vite',
  // ./public — mockServiceWorker.js для msw-storybook-addon, ../public — иконки приложения.
  staticDirs: ['./public', '../public'],
  core: { disableTelemetry: true },
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: viteConfig.plugins?.flat(Infinity as 1).filter((plugin) => !isPwaPlugin(plugin)),
  }),
};

export default config;
