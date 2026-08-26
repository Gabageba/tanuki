import { describe, expect, it } from 'vitest';
import { parseFilterQuery } from './parse-filter-query';

describe('parseFilterQuery', () => {
  it('returns an empty array for undefined', () => {
    expect(parseFilterQuery(undefined)).toEqual([]);
  });

  it('parses a single "groupId:key" value as an include selection', () => {
    expect(parseFilterQuery('kind:manga')).toEqual([{ groupId: 'kind', key: 'manga' }]);
  });

  it('parses "groupId:!key" (exclude marker prefixing the key) as an exclude selection', () => {
    expect(parseFilterQuery('genre:!34-fantasy')).toEqual([
      { groupId: 'genre', key: '34-fantasy', exclude: true },
    ]);
  });

  it('handles repeated query values (array) in order', () => {
    expect(parseFilterQuery(['kind:manga', 'status:ongoing', 'genre:!12-action'])).toEqual([
      { groupId: 'kind', key: 'manga' },
      { groupId: 'status', key: 'ongoing' },
      { groupId: 'genre', key: '12-action', exclude: true },
    ]);
  });

  it('drops malformed entries (no separator, empty groupId/key) instead of throwing', () => {
    expect(parseFilterQuery(['no-colon', ':key', 'group:', 'group:!'])).toEqual([]);
  });

  it('parses "groupId:min..max" as a closed range selection', () => {
    expect(parseFilterQuery('averageRating:8.5..10')).toEqual([
      { groupId: 'averageRating', range: { min: 8.5, max: 10 } },
    ]);
  });

  it('parses an open-ended range when one side is blank', () => {
    expect(parseFilterQuery('year:2020..')).toEqual([{ groupId: 'year', range: { min: 2020 } }]);
    expect(parseFilterQuery('year:..2020')).toEqual([{ groupId: 'year', range: { max: 2020 } }]);
  });

  it('drops a range with both sides blank or non-numeric', () => {
    expect(parseFilterQuery(['group:..', 'group:foo..10'])).toEqual([]);
  });
});
