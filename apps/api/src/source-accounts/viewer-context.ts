import { AsyncLocalStorage } from 'node:async_hooks';
import { VIEWER_KIND, type Viewer } from './models';

const storage = new AsyncLocalStorage<Viewer>();

/**
 * Зритель текущего запроса. Вне HTTP-запроса (крон, прогрев) — SERVICE: там работа не
 * принадлежит никому из пользователей.
 */
export const getViewer = (): Viewer => storage.getStore() ?? { kind: VIEWER_KIND.SERVICE };

export const runAsViewer = <T>(viewer: Viewer, fn: () => T): T => storage.run(viewer, fn);

/**
 * Работа, результат которой общий для всех (веер совпадений кешируется на всех), — идёт от
 * сервисной учётки, даже если её запустил запрос пользователя.
 */
export const runAsService = <T>(fn: () => Promise<T>): Promise<T> =>
  storage.run({ kind: VIEWER_KIND.SERVICE }, fn);
