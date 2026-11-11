import {
  RESTORE_FOLDER_POLICY,
  RESTORE_PROGRESS_POLICY,
  type Backup,
  type BackupBookmark,
  type BackupChapterRead,
  type BackupProgress,
  type RestoreFolderPolicy,
  type RestoreProgressPolicy,
} from '@tanuki/contracts';
import { splitCompositeId } from '../common/opaque-id';
import type { BookmarkFolderRecord } from '../library/bookmark-folders.service';
import { resolveGroupFolder } from '../library/bookmark-groups';
import { titleKeyOf } from '../library/bookmarks.service';
import { isSameRef, planFolders } from '../library/library-merge';
import type { BookmarkState } from '../library/models';
import type {
  BookmarkInsert,
  FolderRef,
  FolderTarget,
  GroupMove,
  ProgressMark,
  RestorePlan,
} from './models';

export type RestorePlanInput = {
  backup: Backup;
  /** Источники, которые есть на этом инстансе; строки остальных пропускаются. */
  knownSourceIds: ReadonlySet<string>;
  /** Папки пользователя, встроенные уже созданы. */
  folders: BookmarkFolderRecord[];
  bookmarks: BookmarkState[];
  progress: ProgressMark[];
  /** chapterId глав, что уже в статистике. */
  chapterReadIds: ReadonlySet<string>;
  /** Канонический ключ группы для ключей пользователя и копии (TitleLinksService). */
  canonical: ReadonlyMap<string, string>;
  folderPolicy: RestoreFolderPolicy;
  progressPolicy: RestoreProgressPolicy;
};

/** Самая свежая по `updatedAt` из строк — так же решается папка разошедшейся группы. */
const freshest = <T extends { updatedAt: string }>(rows: T[]): T =>
  rows.reduce((latest, row) => (row.updatedAt > latest.updatedAt ? row : latest));

/**
 * Дальше ли отметка из копии, чем ваша: больше номер главы, при равенстве — дальше страница. Если
 * у одной из сторон номера нет, сравнивать нечего — побеждает свежая.
 */
export const isFurther = (backup: BackupProgress, mine: ProgressMark) => {
  if (backup.chapterNumber === null || mine.chapterNumber === null) {
    return new Date(backup.updatedAt).getTime() > mine.updatedAt.getTime();
  }
  if (backup.chapterNumber !== mine.chapterNumber) {
    return backup.chapterNumber > mine.chapterNumber;
  }
  return backup.pageIndex > mine.pageIndex;
};

const winsProgress = (
  policy: RestoreProgressPolicy,
  backup: BackupProgress,
  mine: ProgressMark,
) => {
  switch (policy) {
    case RESTORE_PROGRESS_POLICY.FURTHEST:
      return isFurther(backup, mine);
    case RESTORE_PROGRESS_POLICY.KEEP_MINE:
      return false;
    case RESTORE_PROGRESS_POLICY.FROM_BACKUP:
      return true;
  }
};

/** Последняя строка на ключ: в копии ключ и так уникален, но файл мог быть собран руками. */
const uniqueBy = <T>(rows: T[], keyOf: (row: T) => string) => [
  ...new Map(rows.map((row) => [keyOf(row), row])).values(),
];

/** Ключ и источник закладки по её titleId; битый id — null, строка просто не ляжет. */
const resolveBookmarkKey = (row: BackupBookmark) => {
  try {
    return { titleKey: titleKeyOf(row.titleId), sourceId: splitCompositeId(row.titleId).sourceId };
  } catch {
    return null;
  }
};

/**
 * Закладки по группам подтверждённых совпадений. Группы нет у пользователя — добавляется в папку
 * копии. Есть — недостающие строки становятся ещё одним источником той же закладки: в её папке
 * («Оставить мои») или в папке копии, куда переезжает и вся группа («Взять из копии»). Счётчики —
 * в тайтлах (группах), не в строках.
 */
const planBookmarks = (input: RestorePlanInput, targetOf: (folderKey: string) => FolderTarget) => {
  const keyOf = (titleKey: string) => input.canonical.get(titleKey) ?? titleKey;
  const userGroups = new Map<string, BookmarkState[]>();
  for (const row of input.bookmarks) {
    const key = keyOf(row.titleKey);
    userGroups.set(key, [...(userGroups.get(key) ?? []), row]);
  }

  type Resolved = BackupBookmark & { titleKey: string; sourceId: string };
  const backupGroups = new Map<string, { known: Resolved[]; hasUnknown: boolean }>();
  for (const row of input.backup.bookmarks) {
    const resolved = resolveBookmarkKey(row);
    if (!resolved) continue;
    const key = keyOf(resolved.titleKey);
    const group = backupGroups.get(key) ?? { known: [], hasUnknown: false };
    if (input.knownSourceIds.has(resolved.sourceId)) {
      group.known.push({ ...row, ...resolved });
    } else {
      group.hasUnknown = true;
    }
    backupGroups.set(key, group);
  }

  const inserts: BookmarkInsert[] = [];
  const moves: GroupMove[] = [];
  const counts = { added: 0, sameFolder: 0, otherFolder: 0, moved: 0, skipped: 0, toPlanned: 0 };
  const insert = (rows: Resolved[], folder: FolderRef) => {
    for (const { titleKey, sourceId, ...row } of rows) {
      inserts.push({ row, titleKey, sourceId, folder });
    }
  };

  for (const [key, { known, hasUnknown }] of backupGroups) {
    if (known.length === 0) {
      if (hasUnknown) counts.skipped += 1;
      continue;
    }
    const rows = uniqueBy(known, ({ titleKey }) => titleKey);
    const target = targetOf(freshest(rows).folderKey);
    const mine = userGroups.get(key);

    if (!mine) {
      insert(rows, target.ref);
      counts.added += 1;
      if (target.isOverLimit) counts.toPlanned += 1;
      continue;
    }

    const groupFolder: FolderRef = { id: resolveGroupFolder(mine) };
    const mineKeys = new Set(mine.map(({ titleKey }) => titleKey));
    const missing = rows.filter(({ titleKey }) => !mineKeys.has(titleKey));
    if (isSameRef(target.ref, groupFolder)) {
      counts.sameFolder += 1;
      insert(missing, groupFolder);
      continue;
    }

    counts.otherFolder += 1;
    switch (input.folderPolicy) {
      case RESTORE_FOLDER_POLICY.KEEP_MINE:
        insert(missing, groupFolder);
        break;
      case RESTORE_FOLDER_POLICY.FROM_BACKUP:
        insert(missing, target.ref);
        moves.push({ titleKeys: [...mineKeys], folder: target.ref });
        counts.moved += 1;
        if (target.isOverLimit) counts.toPlanned += 1;
        break;
    }
  }

  return { inserts, moves, counts };
};

/** Отметки по `titleKey`: нет — пишется при любом выборе, разошлись — решает политика. */
const planProgress = (input: RestorePlanInput) => {
  const mineByKey = new Map(input.progress.map((mark) => [mark.titleKey, mark]));
  const upserts: BackupProgress[] = [];
  const counts = { added: 0, differs: 0, updated: 0, skipped: 0 };

  for (const row of uniqueBy(input.backup.progress, ({ titleKey }) => titleKey)) {
    if (!input.knownSourceIds.has(row.sourceId)) {
      counts.skipped += 1;
      continue;
    }
    const mine = mineByKey.get(row.titleKey);
    if (!mine) {
      upserts.push(row);
      counts.added += 1;
      continue;
    }
    if (mine.chapterId === row.chapterId && mine.pageIndex === row.pageIndex) continue;

    counts.differs += 1;
    if (winsProgress(input.progressPolicy, row, mine)) {
      upserts.push(row);
      counts.updated += 1;
    }
  }

  return { upserts, counts };
};

/** Журнал — объединение: глава, что уже в статистике, остаётся со своей датой прочтения. */
const planChapterReads = (input: RestorePlanInput) => {
  const added: BackupChapterRead[] = [];
  let skipped = 0;
  for (const row of uniqueBy(input.backup.chapterReads, ({ chapterId }) => chapterId)) {
    if (!input.knownSourceIds.has(row.sourceId)) {
      skipped += 1;
    } else if (!input.chapterReadIds.has(row.chapterId)) {
      added.push(row);
    }
  }
  return { added, skipped };
};

/** Минуты чтения без повторов: одна и та же минута дважды — большее из двух. */
const mergeReadingActivity = (rows: Backup['readingActivity']) => {
  const byMinute = new Map<string, Backup['readingActivity'][number]>();
  for (const row of rows) {
    const key = new Date(row.minute).toISOString();
    const existing = byMinute.get(key);
    if (!existing || row.seconds > existing.seconds) byMinute.set(key, row);
  }
  return [...byMinute.values()];
};

/** Что куда ляжет из копии. Ничего не пишет: по нему сводка считает, а запись — пишет. */
export const buildRestorePlan = (input: RestorePlanInput): RestorePlan => {
  const folders = planFolders(input.backup.folders, input.folders);
  const bookmarks = planBookmarks(input, folders.targetOf);
  const progress = planProgress(input);
  const chapterReads = planChapterReads(input);

  return {
    folderCreates: folders.creates,
    bookmarkInserts: bookmarks.inserts,
    groupMoves: bookmarks.moves,
    progressUpserts: progress.upserts,
    chapterReads: chapterReads.added,
    readingActivity: mergeReadingActivity(input.backup.readingActivity),
    counts: {
      bookmarksAdded: bookmarks.counts.added,
      bookmarksSameFolder: bookmarks.counts.sameFolder,
      bookmarksOtherFolder: bookmarks.counts.otherFolder,
      bookmarksMoved: bookmarks.counts.moved,
      bookmarksSkipped: bookmarks.counts.skipped,
      titlesToPlanned: bookmarks.counts.toPlanned,
      foldersAdded: folders.creates.length,
      foldersMatched: folders.matched,
      foldersOverLimit: folders.overLimit,
      progressAdded: progress.counts.added,
      progressDiffers: progress.counts.differs,
      progressUpdated: progress.counts.updated,
      progressSkipped: progress.counts.skipped,
      chapterReadsAdded: chapterReads.added.length,
      chapterReadsSkipped: chapterReads.skipped,
    },
  };
};

/**
 * Настройки, завязанные на источники, — без тех, которых нет на этом инстансе: id источника
 * сами по себе или первая часть ключа `sourceId:sectionId` блока подборок.
 */
export const keepKnownSources = (ids: string[] | undefined, known: ReadonlySet<string>) =>
  ids?.filter((id) => known.has(id));

export const keepKnownSections = (keys: string[] | undefined, known: ReadonlySet<string>) =>
  keys?.filter((key) => known.has(key.slice(0, key.indexOf(':'))));
