/** Сервис-воркер нужен для push; в браузерах без него приложение работает как раньше. */
export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;

  // В dev воркер отдаёт vite-plugin-pwa (devOptions), в сборке — готовый /sw.js.
  const register = import.meta.env.DEV
    ? navigator.serviceWorker.register('/dev-sw.js?dev-sw', { type: 'module' })
    : navigator.serviceWorker.register('/sw.js');
  register.catch(() => undefined);
};
