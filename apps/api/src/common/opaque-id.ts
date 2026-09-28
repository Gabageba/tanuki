import { NotFoundApiException } from './errors';

export type TitleRef = {
  id: number;
  url: string;
};

export type ChapterRef = {
  id: number;
  url: string;
  branch: string | null;
};

const encode = (value: unknown): string => {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
};

const decode = <T>(value: string): T => {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
};

export const encodeTitleId = (ref: TitleRef): string => {
  return encode(ref);
};

export const decodeTitleId = (id: string): TitleRef => {
  try {
    return decode<TitleRef>(id);
  } catch {
    throw new NotFoundApiException('invalidTitleId');
  }
};

export const encodeChapterId = (ref: ChapterRef): string => {
  return encode(ref);
};

export const decodeChapterId = (id: string): ChapterRef => {
  try {
    return decode<ChapterRef>(id);
  } catch {
    throw new NotFoundApiException('invalidChapterId');
  }
};

/** Разбирает составной id вида «sourceId:opaqueId» (см. Title.id/Chapter.id в контрактах) —
 *  формат, в котором клиент теперь передаёт id тайтла и главы целиком, без разбора на части. */
export const splitCompositeId = (id: string): { sourceId: string; opaqueId: string } => {
  const separator = id.indexOf(':');
  if (separator <= 0) throw new NotFoundApiException('invalidIdentifier', { id });

  return { sourceId: id.slice(0, separator), opaqueId: id.slice(separator + 1) };
};
