import {
  BUILT_IN_BOOKMARK_FOLDER,
  CUSTOM_BOOKMARK_FOLDERS_LIMIT,
  type BackupBookmark,
  type BackupFolder,
} from '@tanuki/contracts';
import { type BookmarkFolderRecord, isReservedFolderName } from './bookmark-folders.service';

/** Куда ляжет закладка: в папку, что уже есть, или в ту, что запись создаст. */
export type FolderRef = { id: string; key?: undefined } | { id?: undefined; key: string };

/** Папка извне (копии или сайта) и её место у пользователя. `isOverLimit` — своя папка не
 *  поместилась в лимит, её тайтлы ложатся во «В планах». */
export type FolderTarget = { ref: FolderRef; isOverLimit: boolean };

/** Чужая папка — из копии или с сайта: те же поля, что у папки копии. */
export type MergeFolder = BackupFolder;

/** Строка закладки, которую запись вставит: снимок тайтла и папка. */
export type MergeBookmarkInsert = {
  row: Pick<
    BackupBookmark,
    'titleId' | 'name' | 'coverUrl' | 'contentRating' | 'type' | 'visitedAt' | 'createdAt'
  >;
  titleKey: string;
  sourceId: string;
  folder: FolderRef;
};

/** Перенос всех строк группы пользователя в чужую папку («Взять из копии/источника»). */
export type GroupMove = { titleKeys: string[]; folder: FolderRef };

export const isSameRef = (a: FolderRef, b: FolderRef) =>
  a.id !== undefined ? a.id === b.id : a.key === b.key;

/**
 * Чужие папки на папки пользователя. Встроенная — по `builtIn`; своя — по имени без учёта
 * регистра (тот же ключ, что у уникального индекса): совпала — это она, иначе создаётся в конце, в
 * порядке `position`, пока не кончится лимит. Не поместившиеся и с занятым встроенной именем
 * ложатся во «В планах».
 */
export const planFolders = (incoming: MergeFolder[], folders: BookmarkFolderRecord[]) => {
  const planned = folders.find(({ builtIn }) => builtIn === BUILT_IN_BOOKMARK_FOLDER.PLANNED);
  if (!planned) throw new Error('Встроенные папки должны быть созданы до расчёта');
  const plannedRef: FolderRef = { id: planned.id };

  const byBuiltIn = new Map(
    folders.flatMap((f) => (f.builtIn ? [[f.builtIn, f.id] as const] : [])),
  );
  const byName = new Map<string, FolderRef>(
    folders.flatMap((f) =>
      f.name ? [[f.name.trim().toLocaleLowerCase(), { id: f.id }] as const] : [],
    ),
  );
  let slots =
    CUSTOM_BOOKMARK_FOLDERS_LIMIT - folders.filter(({ builtIn }) => builtIn === null).length;

  const targets = new Map<string, FolderTarget>();
  const creates: MergeFolder[] = [];
  const matched = new Set<string>();
  let overLimit = 0;

  for (const folder of [...incoming].sort((a, b) => a.position - b.position)) {
    if (folder.builtIn) {
      const id = byBuiltIn.get(folder.builtIn);
      targets.set(folder.key, { ref: id ? { id } : plannedRef, isOverLimit: false });
      continue;
    }
    const name = (folder.name ?? '').trim();
    const lowered = name.toLocaleLowerCase();
    const existing = byName.get(lowered);
    if (existing) {
      // Совпала своя папка пользователя — считаем её один раз; повтор имени внутри набора — нет.
      if (existing.id !== undefined) matched.add(existing.id);
      targets.set(folder.key, { ref: existing, isOverLimit: false });
    } else if (isReservedFolderName(name)) {
      targets.set(folder.key, { ref: plannedRef, isOverLimit: false });
    } else if (slots > 0) {
      slots -= 1;
      const ref: FolderRef = { key: folder.key };
      creates.push({ ...folder, name });
      byName.set(lowered, ref);
      targets.set(folder.key, { ref, isOverLimit: false });
    } else {
      overLimit += 1;
      targets.set(folder.key, { ref: plannedRef, isOverLimit: true });
    }
  }

  return {
    targets,
    creates,
    matched: matched.size,
    overLimit,
    targetOf: (folderKey: string): FolderTarget =>
      targets.get(folderKey) ?? { ref: plannedRef, isOverLimit: false },
  };
};

/** Ключи тайтлов, переехавших в папку без слежения: «новые главы» о них из ленты убираются. */
export const listUntrackedMovedKeys = (
  existing: { id: string; trackUpdates: boolean }[],
  creates: MergeFolder[],
  createdIds: Map<string, string>,
  moves: GroupMove[],
  resolve: (ref: FolderRef) => string,
) => {
  const trackedIds = new Set(
    [
      ...existing,
      ...creates.map(({ key, trackUpdates }) => ({ id: createdIds.get(key)!, trackUpdates })),
    ]
      .filter(({ trackUpdates }) => trackUpdates)
      .map(({ id }) => id),
  );
  return moves
    .filter(({ folder }) => !trackedIds.has(resolve(folder)))
    .flatMap(({ titleKeys }) => titleKeys);
};
