import type { ChaptersResponse, TitleDetailsResponse } from '@tanuki/contracts';
import { getOfflineDb } from './db';
import { DEFAULT_CHAPTERS_LIST_KEY } from './models';

/** Снимок тайтла с чем-то скачанным — страница тайтла и читалка без сети. Нет базы — нет снимка. */
export const readTitleSnapshot = async (userId: string, titleId: string) => {
  try {
    return await getOfflineDb(userId).titles.get(titleId);
  } catch {
    return undefined;
  }
};

export const readTitleDetailsSnapshot = async (
  userId: string,
  titleId: string,
): Promise<TitleDetailsResponse | undefined> => (await readTitleSnapshot(userId, titleId))?.details;

/** Ветку по умолчанию (запрос без `branch`) сервер выбирает сам — первую. Если её списка в снимке
 *  нет, берём список первой ветки или любой сохранённый: главы ставили в очередь со страницы тайтла,
 *  где запрос идёт с явной веткой. */
export const readChaptersSnapshot = async (
  userId: string,
  titleId: string,
  listKey: string,
): Promise<ChaptersResponse | undefined> => {
  const snapshot = await readTitleSnapshot(userId, titleId);
  if (!snapshot) return undefined;
  const { chapterLists, details } = snapshot;
  if (chapterLists[listKey] || listKey !== DEFAULT_CHAPTERS_LIST_KEY) return chapterLists[listKey];
  const firstBranchId = details.branches[0]?.id;
  return (firstBranchId && chapterLists[firstBranchId]) || Object.values(chapterLists)[0];
};
