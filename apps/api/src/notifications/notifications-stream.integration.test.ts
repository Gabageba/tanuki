import 'reflect-metadata';
import { Controller, Module, Sse } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { describe, expect, it, vi } from 'vitest';
import type { Observable } from 'rxjs';
import {
  NOTIFICATION_STREAM_CONTROL_EVENT,
  NOTIFICATION_STREAM_STOP_REASON,
} from '@tanuki/contracts';
import { MAX_STREAMS_PER_USER } from './models';
import { NotificationsHubService, type StreamMessage } from './notifications-hub.service';

describe('notifications SSE transport', () => {
  it('Nest/Fastify доставляет последний stop-кадр до EOF и освобождает потоки', async () => {
    const hub = new NotificationsHubService();
    @Controller('notifications')
    class StreamController {
      @Sse('stream')
      stream(): Observable<StreamMessage> {
        return hub.open('me');
      }
    }
    @Module({ controllers: [StreamController] })
    class StreamModule {}

    const app = await NestFactory.create<NestFastifyApplication>(
      StreamModule,
      new FastifyAdapter(),
      { logger: false },
    );
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 8_000);
    try {
      await app.listen(0, '127.0.0.1');
      const url = `${await app.getUrl()}/notifications/stream`;
      const first = await fetch(url, { signal: abort.signal });
      expect(first.headers.get('content-type')).toContain('text/event-stream');
      const lastFrame = first.text();
      for (let index = 0; index < MAX_STREAMS_PER_USER; index++) {
        const response = await fetch(url, { signal: abort.signal });
        expect(response.status).toBe(200);
      }
      const body = await lastFrame;
      expect(body).toContain(`event: ${NOTIFICATION_STREAM_CONTROL_EVENT.STOP}\n`);
      expect(body).toContain(
        `data: ${JSON.stringify({ reason: NOTIFICATION_STREAM_STOP_REASON.CONNECTION_LIMIT })}\n\n`,
      );
      expect(hub.countStreams('me')).toBe(MAX_STREAMS_PER_USER);
      abort.abort();
      await vi.waitFor(() => expect(hub.countStreams('me')).toBe(0));
    } finally {
      clearTimeout(timeout);
      abort.abort();
      await app.close();
    }
  }, 10_000);
});
