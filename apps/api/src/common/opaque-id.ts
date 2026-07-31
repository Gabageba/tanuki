import { NotFoundApiException } from './errors';

export interface MangaRef {
  id: number;
  url: string;
}

export interface ChapterRef {
  id: number;
  url: string;
  branch: string | null;
}

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function decode<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

export function encodeMangaId(ref: MangaRef): string {
  return encode(ref);
}

export function decodeMangaId(id: string): MangaRef {
  try {
    return decode<MangaRef>(id);
  } catch {
    throw new NotFoundApiException('Некорректный id тайтла');
  }
}

export function encodeChapterId(ref: ChapterRef): string {
  return encode(ref);
}

export function decodeChapterId(id: string): ChapterRef {
  try {
    return decode<ChapterRef>(id);
  } catch {
    throw new NotFoundApiException('Некорректный id главы');
  }
}
