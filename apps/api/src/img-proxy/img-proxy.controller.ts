import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Query,
  Res,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import sharp from 'sharp';
import { request } from 'undici';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import { pipeline, type Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import type { ParsersRegistry } from '@tanuki/parsers';
import {
  BadRequestApiException,
  InvalidImageException,
  SourceUnavailableException,
} from '../common/errors';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { PARSERS } from '../parsers-client/parsers-client.module';
import { CacheService } from '../cache/cache.service';
import { CACHE_TTL } from '../cache/cache.constants';
import { cacheKey } from '../cache/cache-keys';
import {
  IMAGE_FORMAT,
  IMAGE_WIDTHS,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_PIXELS,
  type ImageFormat,
  type TransformedImage,
} from './models';
import { verifySignedImageUrl } from './sign.util';
import { UPSTREAM_POLICY, type UpstreamPolicy } from './upstream-policy';
import { ImageConcurrencyService } from './image-concurrency.service';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// Sharp's process-wide operation cache is additional to the active image buffers.
sharp.cache({ memory: 16, files: 0, items: 32 });

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of stream) {
    const buffer = chunk instanceof Buffer ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > IMAGE_MAX_BYTES) throw new InvalidImageException();
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
};

@ApiTags('images')
@Controller('img')
export class ImgProxyController implements OnModuleDestroy {
  // Dedupes concurrent cache-miss requests for the same (url, width, format): a cold catalog
  // page loading many cards at once would otherwise trigger one upstream fetch + sharp resize
  // per in-flight request for the same cover instead of sharing a single one.
  private readonly inFlight = new Map<string, Promise<TransformedImage>>();
  // Соединения только с публичными адресами — см. upstream-guard.ts.

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(PARSERS) private readonly parsers: ParsersRegistry,
    private readonly cache: CacheService,
    private readonly concurrency: ImageConcurrencyService,
    @Inject(UPSTREAM_POLICY) private readonly upstream: UpstreamPolicy,
  ) {}

  @ApiOperation({ summary: 'Проксирует и опционально ресайзит подписанный URL картинки' })
  @ApiQuery({ name: 'u', description: 'Исходный URL картинки (часть подписи)' })
  @ApiQuery({ name: 's', description: 'sourceId (часть подписи)' })
  @ApiQuery({ name: 'exp', description: 'Unix-время истечения подписи' })
  @ApiQuery({ name: 'sig', description: 'HMAC-подпись' })
  @ApiQuery({
    name: 'w',
    required: false,
    type: Number,
    description: 'Целевая ширина (только обложки)',
  })
  @ApiQuery({
    name: 'f',
    required: false,
    enum: ['webp', 'avif'],
    description: 'Целевой формат (только обложки)',
  })
  @ApiProduces('image/*')
  @Get()
  async proxy(
    @Query('u') u: string,
    @Query('s') s: string,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
    @Query('w') w: string | undefined,
    @Query('f') f: string | undefined,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const absoluteUrl = verifySignedImageUrl(this.env.IMG_SIGN_SECRET, { u, s, exp, sig });
    const width = w === undefined ? undefined : Number(w);
    if (
      width !== undefined &&
      (!Number.isSafeInteger(width) || width < 1 || width > Math.max(...IMAGE_WIDTHS))
    ) {
      throw new BadRequestApiException();
    }
    const format = f === IMAGE_FORMAT.WEBP || f === IMAGE_FORMAT.AVIF ? f : undefined;

    // Ресайз/перекодирование — только для обложек (doc04), и только этот путь кешируется в
    // Valkey: байты для одного (url, width, format) неизменны по построению, а сами обложки
    // маленькие (десятки КБ). Страницы глав всегда запрашиваются без w/f и не кешируются.
    if (width || format) {
      const key = cacheKey('images', s, u, width ?? 0, format ?? 'jpeg');
      const { value } = await this.cache.getOrSet(key, CACHE_TTL.images, () =>
        this.dedupedFetchAndTransform(key, absoluteUrl, s, width, format),
      );
      // Cache-Control выставляется только тут, после успешного получения байт — если апстрим
      // недоступен и fetchAndTransform бросает исключение, ответ с ошибкой не должен уйти
      // клиенту с этим же immutable-заголовком и осесть в кеше браузера/CDN как "успех навечно".
      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      reply.header('Content-Type', value.contentType);
      reply.status(HttpStatus.OK).send(Buffer.from(value.bodyBase64, 'base64'));
      return;
    }

    const controller = new AbortController();
    const close = () => controller.abort();
    reply.raw.once('close', close);
    if (reply.raw.destroyed) controller.abort();
    try {
      await this.concurrency.runDownload(async () => {
        const upstream = await this.fetchUpstream(absoluteUrl, s, controller.signal);
        const contentType = upstream.headers['content-type'];
        // Buffered rather than streamed straight through: sources like INKSTORY serve images
        // XOR'd against a key fetched separately (parsers.decodeImage), which needs the full body
        // up front — a no-op passthrough for every other source.
        const raw = await streamToBuffer(this.decodeBody(upstream));
        const decoded = await this.parsers.decodeImage(s, raw, absoluteUrl);
        if (decoded.length > IMAGE_MAX_BYTES) throw new InvalidImageException();
        reply.header('Cache-Control', 'public, max-age=31536000, immutable');
        reply.header(
          'Content-Type',
          Array.isArray(contentType)
            ? (contentType[0] ?? '')
            : (contentType ?? 'application/octet-stream'),
        );
        const sent = finished(reply.raw, { cleanup: true });
        reply.status(HttpStatus.OK).send(decoded);
        await sent;
      }, controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) throw error;
    } finally {
      reply.raw.off('close', close);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.upstream.agent.close();
  }

  // Each parser knows its own Referer/User-Agent expectations (Grouple in particular needs
  // a specific UA on image requests) — falls back to the image's own origin for sources with
  // no special requirements, same as the old hardcoded-map default did.
  private async fetchUpstream(absoluteUrl: string, sourceId: string, signal?: AbortSignal) {
    if (!this.upstream.isAllowedUrl(absoluteUrl)) throw new BadRequestApiException();
    const parserHeaders = this.parsers.imageHeaders(sourceId, absoluteUrl);
    const headers: Record<string, string> = {
      Referer: parserHeaders['Referer'] ?? `${new URL(absoluteUrl).origin}/`,
      'User-Agent': parserHeaders['User-Agent'] ?? DEFAULT_USER_AGENT,
    };

    let upstream;
    try {
      upstream = await request(absoluteUrl, {
        method: 'GET',
        headers,
        dispatcher: this.upstream.agent,
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(this.env.SOURCE_HTTP_TIMEOUT_MS)])
          : AbortSignal.timeout(this.env.SOURCE_HTTP_TIMEOUT_MS),
        headersTimeout: this.env.SOURCE_HTTP_TIMEOUT_MS,
        bodyTimeout: this.env.SOURCE_HTTP_TIMEOUT_MS,
      });
    } catch {
      throw new SourceUnavailableException(sourceId);
    }
    if (upstream.statusCode >= 400) {
      upstream.body.destroy();
      throw new SourceUnavailableException(sourceId);
    }
    if (Number(upstream.headers['content-length']) > IMAGE_MAX_BYTES) {
      upstream.body.destroy();
      throw new InvalidImageException();
    }
    return upstream;
  }

  // undici's `request()` (в отличие от `fetch()`) не распаковывает тело автоматически по
  // Content-Encoding. Некоторые источники (напр. static.desu.uno за ddos-guard) отдают
  // картинки гружёными gzip'ом независимо от Accept-Encoding — без ручной распаковки клиент
  // получает сырые gzip-байты под видом image/*, а sharp падает на них с 500.
  private decodeBody(upstream: Awaited<ReturnType<typeof request>>): Readable {
    const contentEncoding = upstream.headers['content-encoding'];
    const encodingValue = Array.isArray(contentEncoding) ? contentEncoding[0] : contentEncoding;
    const body = upstream.body as unknown as Readable;
    const decoded =
      encodingValue === 'gzip' || encodingValue === 'x-gzip'
        ? createGunzip()
        : encodingValue === 'br'
          ? createBrotliDecompress()
          : encodingValue === 'deflate'
            ? createInflate()
            : undefined;
    if (!decoded) return body;
    pipeline(body, decoded, (error) => {
      if (error) decoded.destroy(error);
    });
    return decoded;
  }

  private dedupedFetchAndTransform(
    key: string,
    absoluteUrl: string,
    sourceId: string,
    width: number | undefined,
    format: Exclude<ImageFormat, typeof IMAGE_FORMAT.ORIG> | undefined,
  ): Promise<TransformedImage> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    const promise = this.concurrency
      .runDownload(() => this.fetchAndTransform(absoluteUrl, sourceId, width, format))
      .finally(() => {
        this.inFlight.delete(key);
      });
    this.inFlight.set(key, promise);
    return promise;
  }

  private async fetchAndTransform(
    absoluteUrl: string,
    sourceId: string,
    width: number | undefined,
    format: Exclude<ImageFormat, typeof IMAGE_FORMAT.ORIG> | undefined,
  ): Promise<TransformedImage> {
    const upstream = await this.fetchUpstream(absoluteUrl, sourceId);
    const raw = await streamToBuffer(this.decodeBody(upstream));
    const decoded = await this.parsers.decodeImage(sourceId, raw, absoluteUrl);

    if (decoded.length > IMAGE_MAX_BYTES) throw new InvalidImageException();
    // Keep the download slot while waiting for Sharp: at most the admitted downloads
    // retain input buffers, while slow source requests can overlap image processing.
    return this.concurrency.runTransform(async () => {
      const transform = sharp(decoded, { limitInputPixels: IMAGE_MAX_PIXELS });
      if (width) transform.resize({ width, withoutEnlargement: true });
      if (format) transform.toFormat(format);
      const bodyBuffer = await transform.toBuffer();
      return {
        contentType: `image/${format ?? 'jpeg'}`,
        bodyBase64: bodyBuffer.toString('base64'),
      };
    });
  }
}
