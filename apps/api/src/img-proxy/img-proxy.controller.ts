import { Controller, Get, HttpStatus, Inject, Query, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import sharp from 'sharp';
import { request } from 'undici';
import type { ParsersRegistry } from '@tanuki/parsers';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import type { Readable } from 'node:stream';
import { SourceUnavailableException } from '../common/errors';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { PARSERS } from '../parsers-client/parsers-client.module';
import { verifySignedImageUrl } from './sign.util';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

@Controller('img')
export class ImgProxyController {
  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(PARSERS) private readonly parsers: ParsersRegistry,
  ) {}

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

    // Each parser knows its own Referer/User-Agent expectations (Grouple in particular needs
    // a specific UA on image requests) — falls back to the image's own origin for sources with
    // no special requirements, same as the old hardcoded-map default did.
    const parserHeaders = this.parsers.imageHeaders(s, absoluteUrl);
    const headers: Record<string, string> = {
      Referer: parserHeaders['Referer'] ?? `${new URL(absoluteUrl).origin}/`,
      'User-Agent': parserHeaders['User-Agent'] ?? DEFAULT_USER_AGENT,
    };

    let upstream;
    try {
      upstream = await request(absoluteUrl, { method: 'GET', headers });
    } catch {
      throw new SourceUnavailableException(s);
    }

    if (upstream.statusCode >= 400) {
      throw new SourceUnavailableException(s);
    }

    reply.header('Cache-Control', 'public, max-age=31536000, immutable');

    // undici's `request()` (в отличие от `fetch()`) не распаковывает тело автоматически по
    // Content-Encoding. Некоторые источники (напр. static.desu.uno за ddos-guard) отдают
    // картинки гружёными gzip'ом независимо от Accept-Encoding — без ручной распаковки клиент
    // получает сырые gzip-байты под видом image/*, а sharp падает на них с 500.
    const contentEncoding = upstream.headers['content-encoding'];
    const encodingValue = Array.isArray(contentEncoding) ? contentEncoding[0] : contentEncoding;
    const body = upstream.body as unknown as Readable;
    const decodedBody: Readable =
      encodingValue === 'gzip' || encodingValue === 'x-gzip'
        ? body.pipe(createGunzip())
        : encodingValue === 'br'
          ? body.pipe(createBrotliDecompress())
          : encodingValue === 'deflate'
            ? body.pipe(createInflate())
            : body;

    const width = w ? Number.parseInt(w, 10) : undefined;
    const format = f === 'webp' || f === 'avif' ? f : undefined;

    // Ресайз/перекодирование — только для обложек (doc04). Страницы глав всегда
    // запрашиваются без w/f и уходят потоком без буферизации целиком в память.
    if (!width && !format) {
      const contentType = upstream.headers['content-type'];
      reply.header(
        'Content-Type',
        Array.isArray(contentType)
          ? (contentType[0] ?? '')
          : (contentType ?? 'application/octet-stream'),
      );
      reply.status(HttpStatus.OK).send(decodedBody);
      return;
    }

    const transform = sharp();
    if (width) {
      transform.resize({ width, withoutEnlargement: true });
    }
    if (format) {
      transform.toFormat(format);
    }
    reply.header('Content-Type', `image/${format ?? 'jpeg'}`);
    reply.status(HttpStatus.OK).send(decodedBody.pipe(transform));
  }
}
