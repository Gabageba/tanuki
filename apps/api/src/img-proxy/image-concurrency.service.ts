import { Inject, Injectable } from '@nestjs/common';
import { ENV } from '../config/env.module';
import type { Env } from '../config/env';
import { LimitedTaskQueue } from './limited-task-queue';

@Injectable()
export class ImageConcurrencyService {
  private readonly downloads: LimitedTaskQueue;
  private readonly transforms: LimitedTaskQueue;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.downloads = new LimitedTaskQueue(
      env.IMAGE_DOWNLOAD_CONCURRENCY,
      env.IMAGE_DOWNLOAD_QUEUE_LIMIT,
      env.IMAGE_QUEUE_TIMEOUT_MS,
    );
    this.transforms = new LimitedTaskQueue(
      env.IMAGE_TRANSFORM_CONCURRENCY,
      env.IMAGE_TRANSFORM_QUEUE_LIMIT,
      env.IMAGE_COVER_QUEUE_TIMEOUT_MS,
    );
  }

  runDownload<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    return this.downloads.run(task, signal);
  }

  runCoverDownload<T>(task: () => Promise<T>): Promise<T> {
    return this.downloads.run(task, undefined, this.env.IMAGE_COVER_QUEUE_TIMEOUT_MS);
  }

  runTransform<T>(task: () => Promise<T>): Promise<T> {
    return this.transforms.run(task);
  }
}
