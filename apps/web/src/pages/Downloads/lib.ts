import { DOWNLOAD_STATUS } from '@/entities/download/models';
import type { ChapterSnapshotRow, TitleSnapshotRow } from '@/entities/download/models';
import { isServiceWorkerControlling } from '@/shared/lib/serviceWorker';
import type { DownloadedChapter, DownloadedTitle, DownloadItem, DownloadsData } from './models';

const toItem = (data: DownloadsData, row: DownloadItem['row']): DownloadItem => ({
  row,
  title: data.titles.get(row.titleId),
  chapter: data.chapters.get(row.chapterId),
});

/** Очередь сверху вниз: текущая глава первой, остальные по `order`. */
export const getQueueItems = (data: DownloadsData): DownloadItem[] =>
  data.rows
    .filter((row) => row.status !== DOWNLOAD_STATUS.DONE)
    .sort(
      (a, b) =>
        Number(b.status === DOWNLOAD_STATUS.DOWNLOADING) -
          Number(a.status === DOWNLOAD_STATUS.DOWNLOADING) || a.order - b.order,
    )
    .map((row) => toItem(data, row));

/** База уже отдаёт порядок после перетаскивания: главы, которые есть в обоих списках, идут так же.
 *  Докачанные и добавленные за это время главы сравнение не сбивают. */
export const isOrderSettled = (pendingOrder: string[], queueIds: string[]) => {
  const pending = pendingOrder.filter((id) => queueIds.includes(id));
  const current = queueIds.filter((id) => pendingOrder.includes(id));
  return pending.every((id, index) => id === current[index]);
};

const isMissingAtSource = (title: TitleSnapshotRow | undefined, chapterId: string) =>
  title !== undefined &&
  !Object.values(title.chapterLists).some((list) =>
    list.items.some((chapter) => chapter.id === chapterId),
  );

/** Главы по порядку чтения: том, затем номер; без номера — в конце. */
const compareChapters = (a: ChapterSnapshotRow | undefined, b: ChapterSnapshotRow | undefined) => {
  const volumeA = a?.chapter.volume ?? Number.POSITIVE_INFINITY;
  const volumeB = b?.chapter.volume ?? Number.POSITIVE_INFINITY;
  if (volumeA !== volumeB) return volumeA - volumeB;
  return (
    (a?.chapter.number ?? Number.POSITIVE_INFINITY) -
    (b?.chapter.number ?? Number.POSITIVE_INFINITY)
  );
};

/** Тайтлы со скачанными до конца главами, свежескачанные первыми. */
export const getDownloadedTitles = (data: DownloadsData): DownloadedTitle[] => {
  const byTitle = new Map<string, DownloadedChapter[]>();
  data.rows
    .filter((row) => row.status === DOWNLOAD_STATUS.DONE)
    .forEach((row) => {
      const item = toItem(data, row);
      const chapters = byTitle.get(row.titleId) ?? [];
      chapters.push({ ...item, isMissingAtSource: isMissingAtSource(item.title, row.chapterId) });
      byTitle.set(row.titleId, chapters);
    });

  const latestDoneAt = (chapters: DownloadedChapter[]) =>
    chapters.reduce(
      (latest, { row }) => (row.doneAt && row.doneAt > latest ? row.doneAt : latest),
      '',
    );

  return [...byTitle.entries()]
    .map(([titleId, chapters]) => ({
      titleId,
      snapshot: data.titles.get(titleId),
      chapters: chapters.sort((a, b) => compareChapters(a.chapter, b.chapter)),
      bytes: chapters.reduce((sum, { row }) => sum + row.bytes, 0),
    }))
    .sort((a, b) => latestDoneAt(b.chapters).localeCompare(latestDoneAt(a.chapters)));
};

/** Обложка из кеша скачанного — без сети она там одна; не сохранилась — обычная. */
export const getDownloadedCoverUrl = (snapshot: TitleSnapshotRow | undefined) => {
  if (!snapshot) return null;
  if (snapshot.coverKey && isServiceWorkerControlling()) return snapshot.coverKey;
  return snapshot.details.title.coverUrl;
};
