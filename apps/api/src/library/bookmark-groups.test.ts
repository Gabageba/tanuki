import { describe, expect, it } from 'vitest';
import {
  BOOKMARK_AVAILABILITY,
  BOOKMARK_SORT,
  CONTENT_RATING,
  SORT_DIRECTION,
  type BookmarkAvailability,
} from '@tanuki/contracts';
import {
  buildBookmarkGroups,
  countBookmarkGroup,
  matchesBookmarkQuery,
  pickStatBranch,
  sortBookmarkGroups,
  toFolderCopies,
} from './bookmark-groups';
import type { BookmarkRecord, BranchStat, ProgressRecord, SnapshotRecord } from './models';

const at = (minutes: number) => new Date(Date.UTC(2026, 9, 1, 0, minutes));

const row = (titleKey: string, overrides: Partial<BookmarkRecord> = {}): BookmarkRecord => {
  const sourceId = titleKey.split(':')[0]!;
  return {
    userId: 'user',
    titleKey,
    sourceId,
    titleId: `${sourceId}:id-${titleKey}`,
    folderId: 'reading',
    name: `Тайтл ${titleKey}`,
    coverUrl: null,
    contentRating: CONTENT_RATING.SAFE,
    type: null,
    visitedAt: at(0),
    createdAt: at(0),
    updatedAt: at(0),
    ...overrides,
  };
};

const progress = (titleKey: string, overrides: Partial<ProgressRecord> = {}): ProgressRecord => ({
  titleKey,
  sourceId: titleKey.split(':')[0]!,
  branchId: 'default',
  chapterVolume: null,
  chapterNumber: 10,
  updatedAt: at(10),
  ...overrides,
});

const available = (): BookmarkAvailability => BOOKMARK_AVAILABILITY.AVAILABLE;

/** a и b — одна группа (b ↔ a подтверждены), c — сама по себе. */
const LINKED = new Map([
  ['a:/one', 'a:/one'],
  ['b:/one', 'a:/one'],
  ['c:/two', 'c:/two'],
]);

describe('buildBookmarkGroups', () => {
  it('склеивает строки подтверждённых совпадений в одну закладку', () => {
    const groups = buildBookmarkGroups({
      rows: [row('a:/one'), row('b:/one'), row('c:/two')],
      progress: [],
      canonical: LINKED,
      snapshots: new Map(),
      sourceAvailability: available,
    });

    expect(groups).toHaveLength(2);
    expect(groups.find(({ key }) => key === 'a:/one')?.rows).toHaveLength(2);
  });

  it('после отмены связи строки снова две закладки, каждая в своей папке', () => {
    const groups = buildBookmarkGroups({
      rows: [row('a:/one'), row('b:/one', { folderId: 'planned' })],
      progress: [],
      canonical: new Map(),
      snapshots: new Map(),
      sourceAvailability: available,
    });

    expect(groups.map(({ folderId }) => folderId).sort()).toEqual(['planned', 'reading']);
    expect(groups.every(({ folderIds }) => folderIds.length === 1)).toBe(true);
  });

  it('разошедшиеся папки группы — конфликт, а папка группы — у самой свежей строки', () => {
    const [group] = buildBookmarkGroups({
      rows: [
        row('a:/one', { folderId: 'reading', updatedAt: at(1) }),
        row('b:/one', { folderId: 'planned', updatedAt: at(5) }),
      ],
      progress: [],
      canonical: LINKED,
      snapshots: new Map(),
      sourceAvailability: available,
    });

    expect(group?.folderId).toBe('planned');
    expect(group?.folderIds).toEqual(['planned', 'reading']);
  });

  it('ведёт на источник самой свежей отметки чтения', () => {
    const [group] = buildBookmarkGroups({
      rows: [row('a:/one'), row('b:/one')],
      progress: [
        progress('a:/one', { updatedAt: at(1) }),
        progress('b:/one', { updatedAt: at(9), chapterNumber: 42 }),
      ],
      canonical: LINKED,
      snapshots: new Map(),
      sourceAvailability: available,
    });

    expect(group?.target.titleKey).toBe('b:/one');
    expect(group?.progress?.chapterNumber).toBe(42);
    expect(group?.otherSources.map(({ titleKey }) => titleKey)).toEqual(['a:/one']);
  });

  it('без отметок ведёт туда, где добавили', () => {
    const [group] = buildBookmarkGroups({
      rows: [row('a:/one', { createdAt: at(5) }), row('b:/one', { createdAt: at(1) })],
      progress: [],
      canonical: LINKED,
      snapshots: new Map(),
      sourceAvailability: available,
    });

    expect(group?.target.titleKey).toBe('b:/one');
    expect(group?.progress).toBeNull();
  });

  it('выключенный источник целью не становится, пока в группе есть другой', () => {
    const [group] = buildBookmarkGroups({
      rows: [row('a:/one'), row('b:/one', { createdAt: at(3) })],
      progress: [progress('a:/one')],
      canonical: LINKED,
      snapshots: new Map(),
      sourceAvailability: (sourceId) =>
        sourceId === 'a' ? BOOKMARK_AVAILABILITY.SOURCE_DISABLED : BOOKMARK_AVAILABILITY.AVAILABLE,
    });

    expect(group?.target.titleKey).toBe('b:/one');
    // Выключенный источник не предлагается и в меню источников.
    expect(group?.otherSources).toEqual([]);
  });

  it('без доступных источников ведёт на первый и называет его причину', () => {
    const snapshots = new Map<string, SnapshotRecord>([
      ['c:/two', { titleKey: 'c:/two', titleId: 'c:id', checkedAt: at(0), missing: true }],
    ]);
    const [group] = buildBookmarkGroups({
      rows: [row('c:/two')],
      progress: [],
      canonical: LINKED,
      snapshots,
      sourceAvailability: available,
    });

    expect(group?.target.availability).toBe(BOOKMARK_AVAILABILITY.TITLE_MISSING);
  });

  it('копию без известного titleId целью не делает', () => {
    const [group] = buildBookmarkGroups({
      rows: [row('a:/one')],
      progress: [progress('b:/one', { updatedAt: at(30) })],
      canonical: LINKED,
      snapshots: new Map(),
      sourceAvailability: available,
    });

    expect(group?.target.titleKey).toBe('a:/one');
    expect(group?.readAt).toEqual(at(30));
  });
});

const stat = (branchId: string, total: number, newCount = 0): BranchStat => ({
  titleKey: 'a:/one',
  branchId,
  total,
  position: null,
  newCount,
  latestNewAt: newCount > 0 ? at(20) : null,
  latestNumber: total,
});

describe('подсчёт новых глав', () => {
  const [group] = buildBookmarkGroups({
    rows: [row('a:/one')],
    progress: [progress('a:/one', { branchId: 'team' })],
    canonical: LINKED,
    snapshots: new Map(),
    sourceAvailability: available,
  });

  it('считает по ветке отметки чтения, а не по самой длинной', () => {
    const counted = countBookmarkGroup(
      group!,
      [stat('default', 100, 5), stat('team', 50, 2)],
      true,
    );

    expect(counted.branchTotal).toBe(50);
    expect(counted.newChaptersCount).toBe(2);
    expect(counted.latestChapterNumber).toBe(50);
  });

  it('без отметки — по самой длинной ветке', () => {
    expect(pickStatBranch([stat('team', 50), stat('default', 100)], null)?.branchId).toBe(
      'default',
    );
  });

  it('у папки без «Следить за обновлениями» пометки нет', () => {
    const counted = countBookmarkGroup(group!, [stat('team', 50, 2)], false);

    expect(counted.newChaptersCount).toBe(0);
    expect(counted.branchTotal).toBe(50);
  });

  it('у недоступной цели пометки нет', () => {
    const counted = countBookmarkGroup(
      {
        ...group!,
        target: { ...group!.target, availability: BOOKMARK_AVAILABILITY.SOURCE_DOWN },
      },
      [stat('team', 50, 2)],
      true,
    );

    expect(counted.newChaptersCount).toBe(0);
  });

  it('тайтл ещё не проверяли — глав нет, пометки нет', () => {
    const counted = countBookmarkGroup(group!, [], true);

    expect(counted.branchTotal).toBeNull();
    expect(counted.newChaptersCount).toBe(0);
    expect(counted.latestChapterNumber).toBeNull();
  });
});

describe('sortBookmarkGroups', () => {
  const groups = buildBookmarkGroups({
    rows: [
      row('a:/one', { name: 'Бета', createdAt: at(1) }),
      row('c:/two', { name: 'альфа', createdAt: at(2) }),
    ],
    progress: [],
    canonical: LINKED,
    snapshots: new Map(),
    sourceAvailability: available,
  });
  const [first, second] = groups.map((group) =>
    countBookmarkGroup(
      group,
      group.key === 'c:/two' ? [{ ...stat('default', 10, 1), titleKey: 'c:/two' }] : [],
      true,
    ),
  );

  it('«По обновлению» поднимает тайтлы с новыми главами', () => {
    expect(
      sortBookmarkGroups([first!, second!], BOOKMARK_SORT.UPDATED).map(({ key }) => key),
    ).toEqual(['c:/two', 'a:/one']);
  });

  it('«По алфавиту» не зависит от регистра', () => {
    expect(
      sortBookmarkGroups([first!, second!], BOOKMARK_SORT.ALPHABETICAL).map(({ key }) => key),
    ).toEqual(['c:/two', 'a:/one']);
  });

  it('«По дате добавления» — свежие первыми', () => {
    expect(
      sortBookmarkGroups([first!, second!], BOOKMARK_SORT.ADDED).map(({ key }) => key),
    ).toEqual(['c:/two', 'a:/one']);
  });

  it('обратное направление переворачивает порядок', () => {
    expect(
      sortBookmarkGroups([first!, second!], BOOKMARK_SORT.ADDED, SORT_DIRECTION.ASC).map(
        ({ key }) => key,
      ),
    ).toEqual(['a:/one', 'c:/two']);
    expect(
      sortBookmarkGroups([first!, second!], BOOKMARK_SORT.ALPHABETICAL, SORT_DIRECTION.DESC).map(
        ({ key }) => key,
      ),
    ).toEqual(['a:/one', 'c:/two']);
  });

  it('поиск ищет подстроку в названии без учёта регистра', () => {
    expect(matchesBookmarkQuery(first!, 'БЕТ')).toBe(true);
    expect(matchesBookmarkQuery(first!, 'гамма')).toBe(false);
    expect(matchesBookmarkQuery(first!, '  ')).toBe(true);
  });
});

describe('toFolderCopies', () => {
  it('собирает источники по папкам, свежая папка первой', () => {
    expect(
      toFolderCopies([
        row('a:/one', { folderId: 'reading', updatedAt: at(1) }),
        row('b:/one', { folderId: 'planned', updatedAt: at(3) }),
        row('c:/one', { folderId: 'reading', updatedAt: at(2) }),
      ]),
    ).toEqual([
      { folderId: 'planned', sourceIds: ['b'] },
      { folderId: 'reading', sourceIds: ['a', 'c'] },
    ]);
  });
});
