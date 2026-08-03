import { Inject, Injectable } from '@nestjs/common';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';

export class QueueOverflowError extends Error {
  constructor(public readonly sourceId: string) {
    super(`Too many queued requests for source ${sourceId}`);
  }
}

interface SourceQueue {
  active: number;
  queue: Array<() => void>;
}

/**
 * Rate limit на источник: docs/03-parsers.md — "не больше N одновременных запросов к одному
 * домену". Простой семафор на источник в памяти процесса, без внешних очередей.
 */
@Injectable()
export class ConcurrencyLimiterService {
  private readonly sources = new Map<string, SourceQueue>();

  constructor(@Inject(ENV) private readonly env: Env) {}

  private stateOf(sourceId: string): SourceQueue {
    let entry = this.sources.get(sourceId);
    if (!entry) {
      entry = { active: 0, queue: [] };
      this.sources.set(sourceId, entry);
    }
    return entry;
  }

  async run<T>(sourceId: string, task: () => Promise<T>): Promise<T> {
    const state = this.stateOf(sourceId);

    if (state.active >= this.env.SOURCE_MAX_CONCURRENCY) {
      if (state.queue.length >= this.env.SOURCE_QUEUE_LIMIT) {
        throw new QueueOverflowError(sourceId);
      }
      await new Promise<void>((resolve) => state.queue.push(resolve));
    }

    state.active += 1;
    try {
      return await task();
    } finally {
      state.active -= 1;
      state.queue.shift()?.();
    }
  }
}
