import 'reflect-metadata';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import sharp from 'sharp';
import { MockAgent } from 'undici';
import { expect, it, vi } from 'vitest';
import type { ParsersRegistry } from '@tanuki/parsers';
import { CacheService } from '../cache/cache.service';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { loadEnv } from '../config/env';
import { ENV } from '../config/env.module';
import { PARSERS } from '../parsers-client/parsers-client.module';
import { ImageConcurrencyService } from './image-concurrency.service';
import { ImgProxyController } from './img-proxy.controller';
import { IMAGE_FORMAT } from './models';
import { buildSignedImageUrl } from './sign.util';
import { UPSTREAM_POLICY } from './upstream-policy';

it('serves a cold catalog burst when the origin takes several waves to respond', async () => {
  vi.stubEnv('IMG_SIGN_SECRET', 'test-image-signing-secret');
  vi.stubEnv('IMAGE_DOWNLOAD_CONCURRENCY', '8');
  vi.stubEnv('IMAGE_DOWNLOAD_QUEUE_LIMIT', '128');
  vi.stubEnv('IMAGE_TRANSFORM_CONCURRENCY', '1');
  vi.stubEnv('IMAGE_TRANSFORM_QUEUE_LIMIT', '32');
  vi.stubEnv('IMAGE_QUEUE_TIMEOUT_MS', '2000');
  vi.stubEnv('IMAGE_COVER_QUEUE_TIMEOUT_MS', undefined);
  let app: NestFastifyApplication | undefined;
  const agent = new MockAgent();
  agent.disableNetConnect();
  try {
    const env = loadEnv();
    const concurrency = new ImageConcurrencyService(env);
    const coverDownloads = vi.spyOn(concurrency, 'runCoverDownload');
    const parsers: Pick<ParsersRegistry, 'imageHeaders' | 'decodeImage'> = {
      imageHeaders: () => ({}),
      decodeImage: async (_, data) => data,
    };
    const cache: Pick<CacheService, 'getOrSet'> = {
      getOrSet: async (_, __, fetch) => ({
        value: await fetch(),
        stale: false,
        fromCache: false,
        fetchedAt: Date.now(),
      }),
    };
    const module = await Test.createTestingModule({
      controllers: [ImgProxyController],
      providers: [
        { provide: ENV, useValue: env },
        { provide: ImageConcurrencyService, useValue: concurrency },
        { provide: PARSERS, useValue: parsers },
        { provide: CacheService, useValue: cache },
        { provide: UPSTREAM_POLICY, useValue: { agent, isAllowedUrl: () => true } },
      ],
    }).compile();
    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), {
      logger: false,
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    const origin = 'https://covers.example.org';
    const jpeg = await sharp({ create: { width: 2, height: 3, channels: 3, background: 'teal' } })
      .jpeg()
      .toBuffer();
    const upstream = agent.get(origin);
    const urls = Array.from({ length: 30 }, (_, index) => {
      const path = `/${index}.jpg`;
      upstream.intercept({ path }).reply(200, jpeg).delay(800);
      return buildSignedImageUrl(env.IMG_SIGN_SECRET, 'acomics', `${origin}${path}`, {
        width: 360,
        format: IMAGE_FORMAT.WEBP,
      });
    });

    const fastify = app.getHttpAdapter().getInstance();
    const coverResponses = Promise.all(urls.map((url) => fastify.inject({ url })));
    await vi.waitFor(() => expect(coverDownloads).toHaveBeenCalledTimes(urls.length));
    const chapterPage = buildSignedImageUrl(env.IMG_SIGN_SECRET, 'acomics', `${origin}/page.jpg`);
    const pageResponse = await fastify.inject({ url: chapterPage });
    expect(pageResponse.statusCode).toBe(429);
    expect(pageResponse.headers).toMatchObject({ 'retry-after': '1', 'cache-control': 'no-store' });

    const responses = await coverResponses;
    expect(responses.map(({ statusCode }) => statusCode)).toEqual(urls.map(() => 200));
    for (const response of responses) {
      expect(response.headers).toMatchObject({
        'content-type': 'image/webp',
        'cache-control': 'public, max-age=31536000, immutable',
      });
    }
    agent.assertNoPendingInterceptors();
  } finally {
    vi.unstubAllEnvs();
    if (app) await app.close();
    else await agent.close();
  }
}, 10_000);
