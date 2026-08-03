import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import type { ParsersRegistry } from '@tanuki/parsers';
import { PARSERS } from './parsers.provider';

/** Closes every source's undici Agent on shutdown — requires app.enableShutdownHooks() (main.ts). */
@Injectable()
export class ParsersLifecycleService implements OnApplicationShutdown {
  constructor(@Inject(PARSERS) private readonly registry: ParsersRegistry) {}

  async onApplicationShutdown(): Promise<void> {
    await this.registry.close();
  }
}
