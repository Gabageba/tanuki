import { describe, expect, it } from 'vitest';
import { SEARCH_FILTER_GROUP, TITLE_STATE, TITLE_TYPE } from '@tanuki/contracts';
import {
  buildSearchFilters,
  unappliedSearchFilters,
  type SearchFilterSpec,
} from '../src/core/filters/searchFilters';

const spec: SearchFilterSpec = {
  types: {
    groupId: 'type',
    isMultiple: true,
    getKeys: (type) => {
      switch (type) {
        case TITLE_TYPE.MANGA:
          return ['1'];
        case TITLE_TYPE.OTHER:
          return ['7', '8'];
        case TITLE_TYPE.MANHWA:
        case TITLE_TYPE.MANHUA:
        case TITLE_TYPE.COMICS:
          return [];
      }
    },
  },
  states: {
    groupId: 'status',
    isMultiple: false,
    getKeys: (state) =>
      state === TITLE_STATE.ONGOING || state === TITLE_STATE.FINISHED ? [state] : [],
  },
};

describe('buildSearchFilters', () => {
  it('без критериев ничего не выбирает и ничего не помечает', () => {
    expect(buildSearchFilters({}, spec)).toEqual({ filters: [], unapplied: [] });
    expect(buildSearchFilters({ types: [], states: [] }, {})).toEqual({
      filters: [],
      unapplied: [],
    });
  });

  it('значения одного критерия собирает в опции одной группы без повторов', () => {
    expect(buildSearchFilters({ types: [TITLE_TYPE.MANGA, TITLE_TYPE.OTHER] }, spec)).toEqual({
      filters: [
        { groupId: 'type', key: '1' },
        { groupId: 'type', key: '7' },
        { groupId: 'type', key: '8' },
      ],
      unapplied: [],
    });
  });

  it('значение без опции у источника не сужает остальные — критерий не применяется целиком', () => {
    expect(buildSearchFilters({ types: [TITLE_TYPE.MANGA, TITLE_TYPE.MANHWA] }, spec)).toEqual({
      filters: [],
      unapplied: [SEARCH_FILTER_GROUP.TYPES],
    });
  });

  it('радио-группа не принимает несколько значений', () => {
    expect(
      buildSearchFilters({ states: [TITLE_STATE.ONGOING, TITLE_STATE.FINISHED] }, spec),
    ).toEqual({ filters: [], unapplied: [SEARCH_FILTER_GROUP.STATES] });
    expect(buildSearchFilters({ states: [TITLE_STATE.ONGOING] }, spec).filters).toEqual([
      { groupId: 'status', key: 'ongoing' },
    ]);
  });

  it('критерий без группы у источника — неприменённый', () => {
    expect(buildSearchFilters({ types: [TITLE_TYPE.MANGA] }, {})).toEqual({
      filters: [],
      unapplied: [SEARCH_FILTER_GROUP.TYPES],
    });
  });
});

describe('unappliedSearchFilters', () => {
  it('помечает всё выбранное и только его', () => {
    expect(unappliedSearchFilters({ types: [TITLE_TYPE.MANGA], states: [] })).toEqual({
      filters: [],
      unapplied: [SEARCH_FILTER_GROUP.TYPES],
    });
  });
});
