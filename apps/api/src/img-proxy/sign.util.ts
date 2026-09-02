import { createHmac, timingSafeEqual } from 'node:crypto';
import { InvalidSignatureException } from '../common/errors';
import { IMAGE_FORMAT, type SignedImageOptions, type SignedImageParams } from './models';

const SIGNED_URL_TTL_SECONDS = 3600;
const WIDTH_BUCKETS = [360, 480, 720, 1080, 1440] as const;

const sign = (secret: string, u: string, sourceId: string, exp: number): string => {
  return createHmac('sha256', secret).update(`${u}.${sourceId}.${exp}`).digest('hex');
};

const roundWidth = (width: number): number => {
  return WIDTH_BUCKETS.reduce<number>(
    (best, candidate) => (Math.abs(candidate - width) < Math.abs(best - width) ? candidate : best),
    WIDTH_BUCKETS[0],
  );
};

export const buildSignedImageUrl = (
  secret: string,
  sourceId: string,
  absoluteUrl: string,
  options?: SignedImageOptions,
): string => {
  const exp = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
  const u = Buffer.from(absoluteUrl, 'utf8').toString('base64url');
  const sig = sign(secret, u, sourceId, exp);

  const params = new URLSearchParams({ u, s: sourceId, exp: String(exp), sig });
  if (options?.width) {
    params.set('w', String(roundWidth(options.width)));
  }
  if (options?.format && options.format !== IMAGE_FORMAT.ORIG) {
    params.set('f', options.format);
  }

  return `/api/v1/img?${params.toString()}`;
};

export const verifySignedImageUrl = (secret: string, params: SignedImageParams): string => {
  const exp = Number(params.exp);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    throw new InvalidSignatureException();
  }

  const expected = sign(secret, params.u, params.s, exp);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(params.sig);
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    throw new InvalidSignatureException();
  }

  return Buffer.from(params.u, 'base64url').toString('utf8');
};
