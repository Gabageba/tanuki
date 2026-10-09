import {
  BOOKMARK_AVAILABILITY,
  BOOKMARK_SORT,
  DEFAULT_BRANCH_ID,
  getDefaultBookmarkSortDirection,
  type BookmarkAvailability,
  type BookmarkFolderCopy,
  type BookmarkSort,
  type SortDirection,
} from '@tanuki/contracts';
import type {
  BookmarkCandidate,
  BookmarkGroup,
  BookmarkRecord,
  BranchStat,
  CountedBookmarkGroup,
  ProgressRecord,
  SnapshotRecord,
} from './models';

const byTimeDesc = (a: Date, b: Date) => b.getTime() - a.getTime();

/** Строка, которую меняли последней: её папка побеждает, когда папки группы разошлись. */
const freshestRow = (rows: BookmarkRecord[]) =>
  rows.reduce((best, row) => (row.updatedAt > best.updatedAt ? row : best));

/**
 * Разные папки строк группы — свежая первой — и источники в каждой. Одна папка — конфликта нет:
 * функция вернёт один элемент.
 */
export const toFolderCopies = (rows: BookmarkRecord[]): BookmarkFolderCopy[] => {
  const copies = new Map<string, { sourceIds: string[]; updatedAt: Date }>();
  for (const row of rows) {
    const copy = copies.get(row.folderId) ?? { sourceIds: [], updatedAt: row.updatedAt };
    if (!copy.sourceIds.includes(row.sourceId)) copy.sourceIds.push(row.sourceId);
    if (row.updatedAt > copy.updatedAt) copy.updatedAt = row.updatedAt;
    copies.set(row.folderId, copy);
  }
  return [...copies.entries()]
    .sort(([, a], [, b]) => byTimeDesc(a.updatedAt, b.updatedAt))
    .map(([folderId, { sourceIds }]) => ({ folderId, sourceIds }));
};

/** Папка группы: у всех строк одна — она, разошлись — папка самой свежей строки. */
export const resolveGroupFolder = (rows: BookmarkRecord[]) => freshestRow(rows).folderId;

/**
 * Доступность копии: сначала источник (выключен, скрыт настройкой 18+ или лежит), потом сам
 * тайтл на нём (крон получил «не найдено»).
 */
export const resolveCandidateAvailability = (
  sourceAvailability: BookmarkAvailability,
  snapshot: SnapshotRecord | undefined,
): BookmarkAvailability => {
  if (sourceAvailability !== BOOKMARK_AVAILABILITY.AVAILABLE) return sourceAvailability;
  return snapshot?.missing ? BOOKMARK_AVAILABILITY.TITLE_MISSING : BOOKMARK_AVAILABILITY.AVAILABLE;
};

type BuildGroupsInput = {
  rows: BookmarkRecord[];
  progress: ProgressRecord[];
  /** Ключ тайтла → канонический ключ его группы; ключи без связей — сами себе группа. */
  canonical: Map<string, string>;
  snapshots: Map<string, SnapshotRecord>;
  sourceAvailability: (sourceId: string) => BookmarkAvailability;
};

/**
 * Склеивает строки закладок пользователя по группам подтверждённых совпадений и для каждой
 * выбирает, куда ведёт карточка.
 *
 * Кандидаты в цель — сначала копии с отметками чтения (свежая первой), потом строки закладок
 * (ранняя первой — где добавили). Цель — первый доступный кандидат; доступных нет — первый
 * кандидат, и карточка покажет его причину. Копия без известного titleId (читали, но ни разу не
 * открывали страницу тайтла после появления снимков) целью стать не может: вести некуда.
 */
export const buildBookmarkGroups = ({
  rows,
  progress,
  canonical,
  snapshots,
  sourceAvailability,
}: BuildGroupsInput): BookmarkGroup[] => {
  const keyOf = (titleKey: string) => canonical.get(titleKey) ?? titleKey;

  const rowsByGroup = new Map<string, BookmarkRecord[]>();
  for (const row of rows) {
    const key = keyOf(row.titleKey);
    rowsByGroup.set(key, [...(rowsByGroup.get(key) ?? []), row]);
  }
  const progressByGroup = new Map<string, ProgressRecord[]>();
  for (const item of progress) {
    const key = keyOf(item.titleKey);
    if (!rowsByGroup.has(key)) continue;
    progressByGroup.set(key, [...(progressByGroup.get(key) ?? []), item]);
  }

  return [...rowsByGroup.entries()].map(([key, groupRows]) => {
    const groupProgress = [...(progressByGroup.get(key) ?? [])].sort((a, b) =>
      byTimeDesc(a.updatedAt, b.updatedAt),
    );
    const rowsByAge = [...groupRows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const rowByKey = new Map(groupRows.map((row) => [row.titleKey, row]));

    const toCandidate = (titleKey: string, sourceId: string): BookmarkCandidate | null => {
      const titleId = rowByKey.get(titleKey)?.titleId ?? snapshots.get(titleKey)?.titleId;
      if (!titleId) return null;
      return {
        titleKey,
        sourceId,
        titleId,
        availability: resolveCandidateAvailability(
          sourceAvailability(sourceId),
          snapshots.get(titleKey),
        ),
      };
    };

    const candidates: BookmarkCandidate[] = [];
    const seen = new Set<string>();
    for (const { titleKey, sourceId } of [...groupProgress, ...rowsByAge]) {
      if (seen.has(titleKey)) continue;
      const candidate = toCandidate(titleKey, sourceId);
      if (!candidate) continue;
      seen.add(titleKey);
      candidates.push(candidate);
    }

    // Строки закладок всегда несут titleId, так что хотя бы один кандидат есть.
    const target =
      candidates.find(({ availability }) => availability === BOOKMARK_AVAILABILITY.AVAILABLE) ??
      candidates[0]!;
    const firstRow = rowsByAge[0]!;

    return {
      key,
      rows: groupRows,
      folderId: resolveGroupFolder(groupRows),
      folderIds: toFolderCopies(groupRows).map(({ folderId }) => folderId),
      snapshot: rowByKey.get(target.titleKey) ?? firstRow,
      target,
      progress: groupProgress.find(({ titleKey }) => titleKey === target.titleKey) ?? null,
      otherSources: candidates.filter(
        (candidate) =>
          candidate.titleKey !== target.titleKey &&
          candidate.availability !== BOOKMARK_AVAILABILITY.SOURCE_DISABLED,
      ),
      visitedAt: groupRows.reduce(
        (latest, row) => (row.visitedAt > latest ? row.visitedAt : latest),
        firstRow.visitedAt,
      ),
      createdAt: firstRow.createdAt,
      readAt: groupProgress[0]?.updatedAt ?? null,
      checkedAt: snapshots.get(target.titleKey)?.checkedAt ?? null,
    };
  });
};

/**
 * Ветка, по которой считаются главы цели: ветка отметки чтения, без неё — самая длинная (как
 * pickDefaultBranch у списка глав).
 */
export const pickStatBranch = (
  stats: BranchStat[],
  progressBranchId: string | null,
): BranchStat | null => {
  if (progressBranchId !== null) {
    return stats.find(({ branchId }) => branchId === progressBranchId) ?? null;
  }
  return stats.reduce<BranchStat | null>(
    (best, stat) => (!best || stat.total > best.total ? stat : best),
    null,
  );
};

/**
 * Досчитывает группе главы. Новые главы считаются только у доступной цели в папке, за которой
 * следят: у остальных пометки нет.
 */
export const countBookmarkGroup = (
  group: BookmarkGroup,
  targetStats: BranchStat[],
  isFolderTracked: boolean,
): CountedBookmarkGroup => {
  const stat = pickStatBranch(targetStats, group.progress?.branchId ?? null);
  const isCounted =
    isFolderTracked && group.target.availability === BOOKMARK_AVAILABILITY.AVAILABLE && !!stat;

  return {
    ...group,
    branchTotal: stat?.total ?? null,
    branchPosition: stat?.position ?? null,
    newChaptersCount: isCounted ? stat.newCount : 0,
    latestNewAt: isCounted ? stat.latestNewAt : null,
  };
};

const compareNullableDesc = (a: Date | null, b: Date | null) => {
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  return byTimeDesc(a, b);
};

/** Название для сортировки по алфавиту — без учёта регистра, с русским порядком букв. */
const COLLATOR = new Intl.Collator('ru', { sensitivity: 'base', numeric: true });

/** Порядок в естественном направлении сортировки (`getDefaultBookmarkSortDirection`). */
const sortInDefaultDirection = (
  groups: CountedBookmarkGroup[],
  sort: BookmarkSort,
): CountedBookmarkGroup[] => {
  const sorted = [...groups];
  switch (sort) {
    case BOOKMARK_SORT.UPDATED:
      // Сначала с новыми главами — свежая новая первой, остальные — по дате проверки.
      return sorted.sort(
        (a, b) =>
          Number(b.newChaptersCount > 0) - Number(a.newChaptersCount > 0) ||
          compareNullableDesc(a.latestNewAt, b.latestNewAt) ||
          compareNullableDesc(a.checkedAt, b.checkedAt),
      );
    case BOOKMARK_SORT.READ:
      return sorted.sort(
        (a, b) => compareNullableDesc(a.readAt, b.readAt) || byTimeDesc(a.createdAt, b.createdAt),
      );
    case BOOKMARK_SORT.ADDED:
      return sorted.sort((a, b) => byTimeDesc(a.createdAt, b.createdAt));
    case BOOKMARK_SORT.ALPHABETICAL:
      return sorted.sort((a, b) => COLLATOR.compare(a.snapshot.name, b.snapshot.name));
  }
};

export const sortBookmarkGroups = (
  groups: CountedBookmarkGroup[],
  sort: BookmarkSort,
  direction: SortDirection = getDefaultBookmarkSortDirection(sort),
): CountedBookmarkGroup[] => {
  const sorted = sortInDefaultDirection(groups, sort);
  // Обратное направление — тот же порядок задом наперёд, вместе с правилами для пустых дат.
  return direction === getDefaultBookmarkSortDirection(sort) ? sorted : sorted.reverse();
};

/** Подстрока снимка названия без учёта регистра — по любой строке группы. */
export const matchesBookmarkQuery = (group: BookmarkGroup, query: string | undefined) => {
  const needle = query?.trim().toLocaleLowerCase();
  if (!needle) return true;
  return group.rows.some((row) => row.name.toLocaleLowerCase().includes(needle));
};

/** Ветка главы в снимке — так же, как в reading_progress. */
export const toSnapshotBranchId = (branch: string | null) => branch ?? DEFAULT_BRANCH_ID;
