import type { z } from 'zod';
import { SearchFilterInvalidException } from '../common/errors';

/** `a, b,,c` → `['a', 'b', 'c']`; без параметра — undefined (ограничения нет). */
export const parseListParam = (raw: string | undefined): string[] | undefined => {
  if (!raw) return undefined;
  const values = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length ? values : undefined;
};

/**
 * Список значений enum'а из query-параметра: значение не из enum'а — 400 с ним в тексте, а не
 * молчаливый пропуск, иначе опечатка в адресе выглядела бы как «ничего не нашлось».
 */
export const parseEnumListParam = <T extends string>(
  raw: string | undefined,
  schema: z.ZodType<T>,
): T[] | undefined =>
  parseListParam(raw)?.map((value) => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) throw new SearchFilterInvalidException(value);
    return parsed.data;
  });
