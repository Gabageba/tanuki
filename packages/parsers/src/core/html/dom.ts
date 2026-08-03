import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

const DEFAULT_CHARSET = 'utf-8';

export interface Doc {
  $: cheerio.CheerioAPI;
  baseUrl: string;
}

function sniffCharset(bytes: Buffer, contentType: string | undefined): string {
  const headerMatch = contentType ? /charset=([\w-]+)/i.exec(contentType) : null;
  if (headerMatch) return headerMatch[1]!.toLowerCase();

  // <meta charset> only ever appears near the top of <head> — no need to scan the whole body.
  const head = bytes.subarray(0, 2048).toString('latin1');
  const metaMatch =
    /<meta[^>]+charset=["']?([\w-]+)/i.exec(head) ??
    /<meta[^>]+content=["'][^"']*charset=([\w-]+)/i.exec(head);
  if (metaMatch) return metaMatch[1]!.toLowerCase();

  return DEFAULT_CHARSET;
}

/**
 * Some RU forum engines (multichan/DLE sites: MANGACHAN, HENCHAN, YAOICHAN, NUDEMOON) serve
 * windows-1251. Decoding as UTF-8 unconditionally would silently mangle every Cyrillic page —
 * no exception, just garbage text — so charset must be sniffed from Content-Type first, then
 * <meta charset>, before falling back to UTF-8.
 */
export function decodeBytes(bytes: Buffer, contentType: string | undefined): string {
  const charset = sniffCharset(bytes, contentType);
  if (charset === 'utf-8' || charset === 'utf8') {
    return bytes.toString('utf-8');
  }
  if (!iconv.encodingExists(charset)) {
    return bytes.toString('utf-8');
  }
  return iconv.decode(bytes, charset);
}

export function parseHtml(html: string, baseUrl: string): Doc {
  return { $: cheerio.load(html), baseUrl };
}
