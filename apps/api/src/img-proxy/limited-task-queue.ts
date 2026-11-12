import { TooManyRequestsException } from '../common/errors';

type Waiter = { start: () => void };

/** A released slot is handed directly to the oldest waiter, never briefly made available
 * to a new request. Waiting tasks hold no downloaded bodies or Sharp pipelines. */
export class LimitedTaskQueue {
  private active = 0;
  private readonly queue: Waiter[] = [];

  constructor(
    private readonly concurrency: number,
    private readonly queueLimit: number,
    private readonly timeoutMs: number,
  ) {}

  async run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    await this.acquire(signal);
    try {
      signal?.throwIfAborted();
      return await task();
    } finally {
      const next = this.queue.shift();
      if (next) next.start();
      else this.active -= 1;
    }
  }

  private async acquire(signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();
    if (this.active < this.concurrency) {
      this.active += 1;
      return;
    }
    if (this.queue.length >= this.queueLimit) throw new TooManyRequestsException(1);

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
      };
      const cancel = (error: unknown) => {
        const index = this.queue.indexOf(waiter);
        if (index === -1) return;
        this.queue.splice(index, 1);
        cleanup();
        reject(error);
      };
      const abort = () => cancel(signal?.reason);
      const waiter = {
        start: () => {
          cleanup();
          resolve();
        },
      };
      const timer = setTimeout(() => cancel(new TooManyRequestsException(1)), this.timeoutMs);
      this.queue.push(waiter);
      signal?.addEventListener('abort', abort, { once: true });
    });
  }
}
