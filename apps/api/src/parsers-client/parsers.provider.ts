import { Logger, type Provider } from '@nestjs/common';
import { createRegistry, type ParsersRegistry } from '@tanuki/parsers';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';

export const PARSERS = Symbol('PARSERS');

const logger = new Logger('ParsersRegistry');

export const parsersProvider: Provider = {
  provide: PARSERS,
  inject: [ENV],
  useFactory: async (env: Env): Promise<ParsersRegistry> => {
    const registry = createRegistry({
      credentials: {
        grouple:
          env.GROUPLE_USERNAME && env.GROUPLE_PASSWORD
            ? { username: env.GROUPLE_USERNAME, password: env.GROUPLE_PASSWORD }
            : undefined,
        allhentai:
          env.ALLHENTAI_USERNAME && env.ALLHENTAI_PASSWORD
            ? { username: env.ALLHENTAI_USERNAME, password: env.ALLHENTAI_PASSWORD }
            : undefined,
        nudemoon:
          env.NUDEMOON_USERNAME && env.NUDEMOON_PASSWORD
            ? { username: env.NUDEMOON_USERNAME, password: env.NUDEMOON_PASSWORD }
            : undefined,
        libsocial: { tokenStoreDir: env.LIBSOCIAL_TOKEN_STORE_DIR },
      },
      timeouts: {
        connect: env.SOURCE_HTTP_TIMEOUT_MS,
        headers: env.SOURCE_HTTP_TIMEOUT_MS,
      },
      logger: {
        info: (message, ...args) => logger.log(message, ...args),
        warn: (message, ...args) => logger.warn(message, ...args),
        error: (message, ...args) => logger.error(message, ...args),
      },
    });
    // Grouple SSO login etc. — allSettled internally, a failed login is logged and leaves
    // that source working anonymously. Deliberately not awaited: it costs a few seconds of
    // network round-trips, and awaiting it here delays app.listen(), which shows up as
    // ECONNREFUSED in the vite dev proxy (the web dev server boots much faster). Calls that
    // actually hit a source await registry.ready() instead — see ParsersClientService.
    void registry.init();
    return registry;
  },
};
