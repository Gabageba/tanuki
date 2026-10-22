/** `beforeEach` истории без сети: `navigator.onLine` отвечает false — на него смотрят `useNetwork`
 *  и обработка ошибок запросов. Сами запросы рвёт `OFFLINE_HANDLERS`. */
export const goOffline = () => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
  // Своё свойство закрывало геттер прототипа — без него navigator снова отвечает честно.
  return () => {
    Reflect.deleteProperty(navigator, 'onLine');
  };
};
