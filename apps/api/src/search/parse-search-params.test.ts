import { describe, expect, it } from 'vitest';
import { TITLE_TYPE, TitleTypeSchema } from '@tanuki/contracts';
import { SearchFilterInvalidException } from '../common/errors';
import { parseEnumListParam, parseListParam } from './parse-search-params';

describe('parse-search-params', () => {
  it('без параметра или с пустым — без ограничения', () => {
    expect(parseListParam(undefined)).toBeUndefined();
    expect(parseListParam(' , ')).toBeUndefined();
    expect(parseListParam('a, b,,c')).toEqual(['a', 'b', 'c']);
  });

  it("значения enum'а проходят как есть", () => {
    expect(parseEnumListParam('manga,manhwa', TitleTypeSchema)).toEqual([
      TITLE_TYPE.MANGA,
      TITLE_TYPE.MANHWA,
    ]);
  });

  it("значение не из enum'а — 400 с ним в params", () => {
    try {
      parseEnumListParam('manga,novel', TitleTypeSchema);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(SearchFilterInvalidException);
      expect((error as SearchFilterInvalidException).getStatus()).toBe(400);
      expect((error as SearchFilterInvalidException).params).toEqual({ value: 'novel' });
    }
  });
});
