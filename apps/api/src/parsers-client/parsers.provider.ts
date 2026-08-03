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
    // that source working anonymously, never blocks boot.
    await registry.init();
    return registry;
  },
};
