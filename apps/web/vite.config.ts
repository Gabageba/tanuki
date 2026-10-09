import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    // Пока сервис-воркер нужен только для push: ни precache, ни офлайн-кэша (они придут с PWA
    // Фазы 4, docs/06-pwa-offline.md). Регистрирует его само приложение (shared/lib/serviceWorker.ts).
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'sw.ts',
      injectRegister: false,
      injectManifest: { injectionPoint: undefined },
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
