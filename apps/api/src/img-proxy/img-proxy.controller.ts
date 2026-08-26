import { Controller, Get, HttpStatus, Inject, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import sharp from 'sharp';
import { request } from 'undici';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import type { Readable } from 'node:stream';
import type { ParsersRegistry } from '@tanuki/parsers';
import { SourceUnavailableException } from '../common/errors';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { PARSERS } from '../parsers-client/parsers-client.module';
import { CacheService } from '../cache/cache.service';
import { CACHE_TTL } from '../cache/cache.constants';
import { cacheKey } from '../cache/cache-keys';
import { IMAGE_FORMAT, type ImageFormat, type TransformedImage } from './models';
import { verifySignedImageUrl } from './sign.util';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

@ApiTags('images')
@Controller('img')
export class ImgProxyController {
  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(PARSERS) private readonly parsers: ParsersRegistry,
    private readonly cache: CacheService,
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
    const width = w ? Number.parseInt(w, 10) : undefined;
    const format = f === IMAGE_FORMAT.webp || f === IMAGE_FORMAT.avif ? f : undefined;

    reply.header('Cache-Control', 'public, max-age=31536000, immutable');

    // Ресайз/перекодирование — только для обложек (doc04), и только этот путь кешируется в
    // Valkey: байты для одного (url, width, format) неизменны по построению, а сами обложки
    // маленькие (десятки КБ). Страницы глав всегда запрашиваются без w/f и не кешируются.
    if (width || format) {
      const key = cacheKey('images', s, u, width ?? 0, format ?? 'jpeg');
      const { value } = await this.cache.getOrSet(key, CACHE_TTL.images, () =>
        this.fetchAndTransform(absoluteUrl, s, width, format),
      );
      reply.header('Content-Type', value.contentType);
      reply.status(HttpStatus.OK).send(Buffer.from(value.bodyBase64, 'base64'));
      return;
    }

    const upstream = await this.fetchUpstream(absoluteUrl, s);
    const contentType = upstream.headers['content-type'];
    reply.header(
      'Content-Type',
      Array.isArray(contentType)
        ? (contentType[0] ?? '')
        : (contentType ?? 'application/octet-stream'),
    );
    // Buffered rather than streamed straight through: sources like INKSTORY serve images
    // XOR'd against a key fetched separately (parsers.decodeImage), which needs the full body
    // up front — a no-op passthrough for every other source.
    const raw = await streamToBuffer(this.decodeBody(upstream));
    const decoded = await this.parsers.decodeImage(s, raw, absoluteUrl);
    reply.status(HttpStatus.OK).send(decoded);
  }

  // Each parser knows its own Referer/User-Agent expectations (Grouple in particular needs
  // a specific UA on image requests) — falls back to the image's own origin for sources with
  // no special requirements, same as the old hardcoded-map default did.
  private async fetchUpstream(absoluteUrl: string, sourceId: string) {
    const parserHeaders = this.parsers.imageHeaders(sourceId, absoluteUrl);
    const headers: Record<string, string> = {
      Referer: parserHeaders['Referer'] ?? `${new URL(absoluteUrl).origin}/`,
      'User-Agent': parserHeaders['User-Agent'] ?? DEFAULT_USER_AGENT,
    };

    let upstream;
    try {
      upstream = await request(absoluteUrl, { method: 'GET', headers });
    } catch {
      throw new SourceUnavailableException(sourceId);
    }
    if (upstream.statusCode >= 400) {
      throw new SourceUnavailableException(sourceId);
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
    return encodingValue === 'gzip' || encodingValue === 'x-gzip'
      ? body.pipe(createGunzip())
      : encodingValue === 'br'
        ? body.pipe(createBrotliDecompress())
        : encodingValue === 'deflate'
          ? body.pipe(createInflate())
          : body;
  }

  private async fetchAndTransform(
    absoluteUrl: string,
    sourceId: string,
    width: number | undefined,
    format: Exclude<ImageFormat, typeof IMAGE_FORMAT.orig> | undefined,
  ): Promise<TransformedImage> {
    const upstream = await this.fetchUpstream(absoluteUrl, sourceId);
    const raw = await streamToBuffer(this.decodeBody(upstream));
    const decoded = await this.parsers.decodeImage(sourceId, raw, absoluteUrl);

    const transform = sharp(decoded);
    if (width) {
      transform.resize({ width, withoutEnlargement: true });
    }
    if (format) {
      transform.toFormat(format);
    }

    const bodyBuffer = await transform.toBuffer();
    return { contentType: `image/${format ?? 'jpeg'}`, bodyBase64: bodyBuffer.toString('base64') };
  }
}
