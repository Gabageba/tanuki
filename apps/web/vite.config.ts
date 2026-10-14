import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    // Воркер держит push, precache app shell, кеш по таблице docs/06-pwa-offline.md и скачивание
    // глав. Регистрирует его само приложение (shared/lib/serviceWorker.ts) и само же предлагает
    // обновление — поэтому 'prompt', а не autoUpdate.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Без сети нужен весь app shell; главный чанк больше лимита по умолчанию (2 МБ).
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: { enabled: true, type: 'module' },
      manifest: {
        name: 'Tanuki — читалка манги',
        short_name: 'Tanuki',
        description: 'Манга, манхва и маньхуа из множества источников',
        start_url: '/',
        display: 'standalone',
        // Цвет фона в тёмной теме приложения: он виден на заставке при запуске и в строке
        // состояния, а манифест читается без CSS, переменные Mantine тут недоступны.
        background_color: '#0a0a0b',
        theme_color: '#0a0a0b',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
