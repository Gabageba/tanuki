import type { ReadingProgressRow } from './models';

/** Строка видна в «Продолжить чтение»: её не убирали или читали уже после того, как убрали. */
export const isShownInContinueReading = ({ hiddenAt, updatedAt }: ReadingProgressRow) =>
  !hiddenAt || updatedAt > hiddenAt;

/**
 * Строки «Продолжить чтение»: по одной на группу подтверждённых совпадений — самая свежая
 * видимая, свежие первыми. Источник, которого у пользователя нет (выключен, скрыт настройкой
 * 18+, пропал из каталога), не попадает в ленту. Строки приходят отсортированными по
 * updated_at убыванию.
 */
export const pickContinueReadingRows = (
  rows: ReadingProgressRow[],
  canonical: Map<string, string>,
  isSourceShown: (sourceId: string) => boolean,
): ReadingProgressRow[] => {
  const seenGroups = new Set<string>();
  return rows.filter((row) => {
    if (!isShownInContinueReading(row) || !isSourceShown(row.sourceId)) return false;
    const group = canonical.get(row.titleKey) ?? row.titleKey;
    if (seenGroups.has(group)) return false;
    seenGroups.add(group);
    return true;
  });
};
