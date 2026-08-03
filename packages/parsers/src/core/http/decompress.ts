import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib';

/**
 * undici's `request()` (unlike `fetch()`) never decompresses the body for you. Some sources
 * (e.g. static.desu.uno behind ddos-guard) send gzip regardless of Accept-Encoding — without
 * this, callers get raw compressed bytes labeled as html/json/image.
 */
export function decompress(bytes: Buffer, contentEncoding: string | undefined): Buffer {
  switch (contentEncoding) {
    case 'gzip':
    case 'x-gzip':
      return gunzipSync(bytes);
    case 'br':
      return brotliDecompressSync(bytes);
    case 'deflate':
      return inflateSync(bytes);
    default:
      return bytes;
  }
}
