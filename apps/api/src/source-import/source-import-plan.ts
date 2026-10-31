import {
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  BUILT_IN_BOOKMARK_FOLDER,
  CONTENT_RATING,
  RESTORE_FOLDER_POLICY,
  RESTORE_PROGRESS_POLICY,
  SOURCE_IMPORT_FOLDER_TARGET,
  catalogEntryFor,
  type RestoreFolderPolicy,
  type RestoreProgressPolicy,
  type SourceImportFolder,
} from '@tanuki/contracts';
import { titleIdOf } from '../common/normalize';
import type { BookmarkFolderRecord } from '../library/bookmark-folders.service';
import { resolveGroupFolder } from '../library/bookmark-groups';
import {
  isSameRef,
  planFolders,
  type FolderRef,
  type FolderTarget,
  type GroupMove,
  type MergeBookmarkInsert,
  type MergeFolder,
} from '../library/library-merge';
import type { BookmarkRecord } from '../library/models';
import { linkKeyOf } from '../matches/title-links.service';
import type { RawBookmark, RawBookmarkFolder } from '../parsers-client/parsers-client.types';
import type {
  ChapterPosition,
  ImportProgressMark,
  PendingProgress,
  SourceImportPlan,
} from './models';

export type SourceImportPlanInput = {
  sourceId: string;
  /** Закладки на сайте по его папкам. */
  siteFolders: RawBookmarkFolder[];
  /** Папки пользователя по порядку вкладок, встроенные уже созданы. */
  folders: BookmarkFolderRecord[];
  bookmarks: BookmarkRecord[];
  progress: ImportProgressMark[];
  /** Канонический ключ группы для ключей пользователя и сайта (TitleLinksService). */
  canonical: ReadonlyMap<string, string>;
  /** Какие папки сайта импортировать; нет — все (сводка). */
  selectedFolderIds?: ReadonlySet<string>;
  folderPolicy: RestoreFolderPolicy;
  progressPolicy: RestoreProgressPolicy;
  /** Время записи — визит и добавление новых закладок. */
  now: Date;
};

/** Точное название без регистра: папки вроде «Любимые авторы» остаются своими. */
const FAVORITE_FOLDER_NAME = /^(?:любим(?:ое|ые|ый|ая)|избранн(?:ое|ые|ый|ая)|favou?rites?)$/iu;
const ON_HOLD_FOLDER_NAME = /^(?:отложено|on hold)$/iu;

const getBuiltInFolderByName = (name: string) => {
  if (FAVORITE_FOLDER_NAME.test(name.trim())) return BUILT_IN_BOOKMARK_FOLDER.FAVORITE;
  if (ON_HOLD_FOLDER_NAME.test(name.trim())) return BUILT_IN_BOOKMARK_FOLDER.ON_HOLD;
  return null;
};

/** «Любимое» и «Отложено» узнаются и среди своих папок сайта. */
const toMergeFolder = (folder: RawBookmarkFolder, position: number): MergeFolder => {
  const builtIn = folder.builtIn ?? getBuiltInFolderByName(folder.name);
  return {
    key: folder.id,
    builtIn,
    name: builtIn ? null : folder.name,
    icon: builtIn ? null : BOOKMARK_FOLDER_ICON.BOOKMARK,
    color: builtIn ? null : BOOKMARK_FOLDER_COLOR.GRAY,
    trackUpdates: true,
    position,
  };
};

/** Как папка сайта легла: по ссылке на нашу папку и по тому, что с ней сделал `planFolders`. */
const describeTarget = (
  target: FolderTarget,
  merge: MergeFolder,
  folders: BookmarkFolderRecord[],
): Pick<SourceImportFolder, 'target' | 'targetFolder'> => {
  if (target.ref.key !== undefined) {
    return {
      target: SOURCE_IMPORT_FOLDER_TARGET.CREATED,
      targetFolder: { builtIn: null, name: merge.name, icon: merge.icon, color: merge.color },
    };
  }
  const folder = folders.find(({ id }) => id === target.ref.id)!;
  const targetFolder = {
    builtIn: folder.builtIn,
    name: folder.name,
    icon: folder.icon,
    color: folder.color,
  };
  if (target.isOverLimit) return { target: SOURCE_IMPORT_FOLDER_TARGET.OVER_LIMIT, targetFolder };
  return {
    target: folder.builtIn
      ? SOURCE_IMPORT_FOLDER_TARGET.BUILT_IN
      : SOURCE_IMPORT_FOLDER_TARGET.MATCHED,
    targetFolder,
  };
};

/**
 * Порядок двух глав: сначала том, если он известен у обеих (нумерация может начинаться заново в
 * каждом томе), затем номер. Отрицательное — `a` раньше, ноль — та же глава.
 */
export const compareChapterPositions = (a: ChapterPosition, b: ChapterPosition) => {
  if (a.chapterVolume !== null && b.chapterVolume !== null && a.chapterVolume !== b.chapterVolume) {
    return a.chapterVolume - b.chapterVolume;
  }
  return a.chapterNumber - b.chapterNumber;
};

/** Порядок главы сайта относительно отметки; null — у отметки нет номера, сравнивать нечего. */
const compareWithMark = (
  site: ChapterPosition,
  mine: Pick<ImportProgressMark, 'chapterVolume' | 'chapterNumber'> &
    Partial<Pick<ImportProgressMark, 'titleKey' | 'pageIndex'>>,
) => {
  if (mine.chapterNumber === null) return null;
  const order = compareChapterPositions(site, {
    chapterVolume: mine.chapterVolume,
    chapterNumber: mine.chapterNumber,
  });
  if (
    order === 0 &&
    site.pageIndex != null &&
    site.titleKey !== undefined &&
    site.titleKey === mine.titleKey
  )
    return site.pageIndex - (mine.pageIndex ?? 0);
  return order;
};

/**
 * Писать ли «где остановился» с сайта: отметки нет — всегда; есть — решает политика.
 * Сначала сравниваются том и глава, затем точная страница одного и того же тайтла,
 * если источник её отдаёт. Страницы разных изданий несопоставимы.
 */
export const winsSiteProgress = (
  policy: RestoreProgressPolicy,
  site: ChapterPosition,
  mine:
    | (Pick<ImportProgressMark, 'chapterVolume' | 'chapterNumber'> &
        Partial<Pick<ImportProgressMark, 'titleKey' | 'pageIndex'>>)
    | undefined,
) => {
  if (mine === undefined) return true;
  const order = compareWithMark(site, mine);
  switch (policy) {
    case RESTORE_PROGRESS_POLICY.FURTHEST:
      return order !== null && order > 0;
    case RESTORE_PROGRESS_POLICY.KEEP_MINE:
      return false;
    case RESTORE_PROGRESS_POLICY.FROM_BACKUP:
      return order !== 0;
  }
};

/** «Где остановился» закладки сайта; null — сайт его не отдал. */
const sitePositionOf = (item: RawBookmark, titleKey: string): ChapterPosition | null =>
  item.lastChapterNumber === null
    ? null
    : {
        chapterVolume: item.lastChapterVolume,
        chapterNumber: item.lastChapterNumber,
        ...(item.lastPageIndex != null ? { pageIndex: item.lastPageIndex, titleKey } : {}),
      };

/**
 * Что куда ляжет из закладок сайта. Ничего не пишет: по нему сводка считает папки, а запись —
 * пишет. Правила — те же, что у восстановления из копии: группы подтверждённых совпадений,
 * «Оставить мои» / «Взять из источника». Уже импортированное (этот же тайтл в той же папке)
 * заново не добавляется, но «где остановился» сравнивается и с ним — на сайте могли уйти дальше.
 * Тайтл, что лежит на сайте в двух папках, берётся из первой: в сводке — из первой вообще, в
 * записи — из первой выбранной, чтобы снятая папка не уносила его с собой.
 */
export const buildSourceImportPlan = (input: SourceImportPlanInput): SourceImportPlan => {
  const { sourceId, selectedFolderIds } = input;
  const keyOf = (titleKey: string) => input.canonical.get(titleKey) ?? titleKey;

  const isSelected = (folderId: string) => !selectedFolderIds || selectedFolderIds.has(folderId);

  /** Тайтл достаётся первой папке, которая на него претендует; остальные папки — не претендуют. */
  const takeFirst = (isClaiming: (folderId: string) => boolean) => {
    const seen = new Set<string>();
    return input.siteFolders.map((folder) =>
      folder.items.filter((item) => {
        if (!isClaiming(folder.id)) return true;
        const titleKey = linkKeyOf(sourceId, item.url);
        if (seen.has(titleKey)) return false;
        seen.add(titleKey);
        return true;
      }),
    );
  };
  const summaryItems = takeFirst(() => true);
  const writeItems = selectedFolderIds ? takeFirst(isSelected) : summaryItems;
  const siteFolders = input.siteFolders.map((folder, position) => ({
    folder,
    merge: toMergeFolder(folder, position),
    items: summaryItems[position]!,
    writeItems: writeItems[position]!,
  }));

  // Лимит своих папок делится между всеми непустыми папками сайта, выбраны они или нет: куда
  // ляжет каждая, сводка уже показала, и снятая галочка у соседней этого не меняет. Непустая —
  // и та, что опустела в сводке из-за дублей, но в записи их получила: соседнюю с ними сняли.
  const isWritten = ({ folder, writeItems }: (typeof siteFolders)[number]) =>
    isSelected(folder.id) && writeItems.length > 0;
  const folderPlan = planFolders(
    siteFolders
      .filter((siteFolder) => siteFolder.items.length > 0 || isWritten(siteFolder))
      .map(({ merge }) => merge),
    input.folders,
  );
  const writtenTargets = siteFolders
    .filter(isWritten)
    .map(({ folder }) => folderPlan.targetOf(folder.id));
  // Создаются только папки, в которые что-то пишется; невыбранная место заняла, но не создаётся.
  const createdKeys = new Set(writtenTargets.flatMap(({ ref }) => (ref.key ? [ref.key] : [])));
  const folderCreates = folderPlan.creates.filter(({ key }) => createdKeys.has(key));
  const matchedIds = new Set(
    writtenTargets.flatMap(({ ref, isOverLimit }) => {
      if (isOverLimit || ref.id === undefined) return [];
      const folder = input.folders.find(({ id }) => id === ref.id);
      return folder && folder.builtIn === null ? [ref.id] : [];
    }),
  );

  const userGroups = new Map<string, BookmarkRecord[]>();
  for (const row of input.bookmarks) {
    const key = keyOf(row.titleKey);
    userGroups.set(key, [...(userGroups.get(key) ?? []), row]);
  }
  const marks = new Map<string, ImportProgressMark>();
  for (const mark of input.progress) {
    const key = keyOf(mark.titleKey);
    const current = marks.get(key);
    if (!current || mark.updatedAt > current.updatedAt) marks.set(key, mark);
  }

  const defaultRating = catalogEntryFor(sourceId).isAdult
    ? CONTENT_RATING.ADULT
    : CONTENT_RATING.SAFE;
  const now = input.now.toISOString();
  const toInsert = (item: RawBookmark, folder: FolderRef): MergeBookmarkInsert => {
    const titleId = titleIdOf(sourceId, item);
    return {
      row: {
        titleId,
        name: item.title,
        coverUrl: item.coverUrl,
        contentRating: item.contentRating ?? defaultRating,
        type: item.type,
        visitedAt: now,
        createdAt: now,
      },
      titleKey: linkKeyOf(sourceId, item.url),
      sourceId,
      folder,
    };
  };

  const inserts: MergeBookmarkInsert[] = [];
  const moves: GroupMove[] = [];
  const movedGroups = new Set<string>();
  const pending: PendingProgress[] = [];
  const counts = { added: 0, asSource: 0, moved: 0, toPlanned: 0 };

  const folders: SourceImportFolder[] = siteFolders.map(
    ({ folder, merge, items, writeItems: written }) => {
      const target = folderPlan.targetOf(folder.id);
      const summary = { total: items.length, fresh: 0, otherFolder: 0, progressDiffers: 0 };
      const shouldWrite = isSelected(folder.id);

      // Сводка считается по своему разбору дублей, запись — по своему.
      for (const item of shouldWrite ? written : items) {
        const titleKey = linkKeyOf(sourceId, item.url);
        const key = keyOf(titleKey);
        const mine = userGroups.get(key);
        const groupFolder: FolderRef | null = mine ? { id: resolveGroupFolder(mine) } : null;
        const hasRow = mine?.some((row) => row.titleKey === titleKey) ?? false;

        // Уже импортирован: ни вставки, ни переноса — ветки ниже для него ничего не делают.
        const isImported = groupFolder !== null && hasRow && isSameRef(target.ref, groupFolder);
        if (!isImported) summary.fresh += 1;

        const mark = marks.get(key);
        const sitePosition = sitePositionOf(item, titleKey);
        if (
          sitePosition !== null &&
          mark !== undefined &&
          compareWithMark(sitePosition, mark) !== 0
        ) {
          summary.progressDiffers += 1;
        }
        const isOtherFolder = groupFolder !== null && !isSameRef(target.ref, groupFolder);
        if (isOtherFolder) summary.otherFolder += 1;
        if (!shouldWrite) continue;

        if (!groupFolder) {
          inserts.push(toInsert(item, target.ref));
          counts.added += 1;
          if (target.isOverLimit) counts.toPlanned += 1;
        } else if (!isOtherFolder || input.folderPolicy === RESTORE_FOLDER_POLICY.KEEP_MINE) {
          if (!hasRow) {
            inserts.push(toInsert(item, groupFolder));
            counts.asSource += 1;
          }
        } else {
          if (!hasRow) inserts.push(toInsert(item, target.ref));
          if (!movedGroups.has(key)) {
            movedGroups.add(key);
            moves.push({ titleKeys: mine!.map((row) => row.titleKey), folder: target.ref });
            counts.moved += 1;
            if (target.isOverLimit) counts.toPlanned += 1;
          }
        }

        if (sitePosition !== null && winsSiteProgress(input.progressPolicy, sitePosition, mark)) {
          pending.push({ titleKey, titleId: titleIdOf(sourceId, item), ...sitePosition });
        }
      }

      return {
        id: folder.id,
        name: folder.name,
        ...describeTarget(target, merge, input.folders),
        ...summary,
      };
    },
  );

  // Меняется только порядок строк сводки: приоритет дублей и лимит новых папок остаются
  // в порядке сайта. Новые и не поместившиеся папки показываются после существующих.
  const folderOrder = new Map(input.folders.map(({ id }, index) => [id, index]));
  const previewOrder = (folder: SourceImportFolder) => {
    const { ref, isOverLimit } = folderPlan.targetOf(folder.id);
    return ref.id !== undefined && !isOverLimit
      ? (folderOrder.get(ref.id) ?? input.folders.length)
      : input.folders.length;
  };

  return {
    folders: folders.sort((a, b) => previewOrder(a) - previewOrder(b)),
    folderCreates,
    bookmarkInserts: inserts,
    groupMoves: moves,
    pendingProgress: pending,
    counts: {
      bookmarksAdded: counts.added,
      bookmarksAsSource: counts.asSource,
      bookmarksMoved: counts.moved,
      titlesToPlanned: counts.toPlanned,
      foldersCreated: folderCreates.length,
      foldersMatched: matchedIds.size,
      foldersOverLimit: writtenTargets.filter(({ isOverLimit }) => isOverLimit).length,
    },
  };
};
