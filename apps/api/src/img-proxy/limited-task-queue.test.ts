import { afterEach, describe, expect, it, vi } from 'vitest';
import { LimitedTaskQueue } from './limited-task-queue';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

afterEach(() => vi.useRealTimers());

describe('image task admission', () => {
  it('hands a slot to the oldest waiter before accepting a new request', async () => {
    const queue = new LimitedTaskQueue(1, 2, 1000);
    const first = deferred();
    const second = deferred();
    const order: number[] = [];
    const a = queue.run(async () => {
      order.push(1);
      await first.promise;
    });
    const b = queue.run(async () => {
      order.push(2);
      await second.promise;
    });
    await Promise.resolve();
    expect(order).toEqual([1]);
    first.resolve();
    await a;
    const c = queue.run(async () => {
      order.push(3);
    });
    await Promise.resolve();
    expect(order).toEqual([1, 2]);
    second.resolve();
    await Promise.all([b, c]);
    expect(order).toEqual([1, 2, 3]);
  });

  it('rejects overflow and frees queued capacity after cancellation or timeout', async () => {
    vi.useFakeTimers();
    const queue = new LimitedTaskQueue(1, 1, 1000);
    const active = deferred();
    const a = queue.run(() => active.promise);
    const controller = new AbortController();
    const cancelledTask = vi.fn(async () => {});
    const b = queue.run(cancelledTask, controller.signal);
    const cancelled = expect(b).rejects.toMatchObject({ name: 'AbortError' });
    await expect(queue.run(async () => {})).rejects.toMatchObject({ status: 429 });
    controller.abort();
    await cancelled;
    const c = queue.run(cancelledTask);
    const expired = expect(c).rejects.toMatchObject({ status: 429 });
    await vi.advanceTimersByTimeAsync(1000);
    await expired;
    active.resolve();
    await a;
    expect(cancelledTask).not.toHaveBeenCalled();
    await expect(queue.run(async () => 'available')).resolves.toBe('available');
  });

  it('releases slots after failed tasks and never starts already cancelled requests', async () => {
    const queue = new LimitedTaskQueue(1, 0, 1000);
    await expect(
      queue.run(async () => {
        throw new Error('upstream failed');
      }),
    ).rejects.toThrow('upstream failed');
    const controller = new AbortController();
    controller.abort();
    const task = vi.fn(async () => 'ok');
    await expect(queue.run(task, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(task).not.toHaveBeenCalled();
    await expect(queue.run(task)).resolves.toBe('ok');
  });
});
