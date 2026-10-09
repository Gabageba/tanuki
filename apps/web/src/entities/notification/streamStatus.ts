/** Подключён ли поток SSE: пока нет, счётчик непрочитанных опрашивается раз в минуту. */
let isConnected = false;
const listeners = new Set<() => void>();

export const setStreamConnected = (next: boolean) => {
  if (isConnected === next) return;
  isConnected = next;
  listeners.forEach((listener) => listener());
};

export const subscribeToStreamStatus = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getStreamConnected = () => isConnected;
