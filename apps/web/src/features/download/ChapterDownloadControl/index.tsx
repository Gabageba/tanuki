import type { MouseEvent } from 'react';
import { useNetwork } from '@mantine/hooks';
import type { Chapter, ChaptersResponse } from '@tanuki/contracts';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import useTitleDetails from '@/entities/title/hooks/useTitleDetails';
import { DOWNLOAD_STATUS, type DownloadRow } from '@/entities/download/models';
import {
  deleteDownloads,
  enqueueChapters,
  isDownloadSupported,
  retryDownloads,
} from '@/entities/download/queue';
import DownloadChapterButton from './DownloadChapterButton';
import DownloadedChapterMenu from './DownloadedChapterMenu';
import DownloadProgressButton from './DownloadProgressButton';
import FailedDownloadButton from './FailedDownloadButton';
import OfflineChapterIcon from './OfflineChapterIcon';
import QueuedDownloadButton from './QueuedDownloadButton';
import { stopRowClick } from './lib';

type Props = {
  titleId: string;
  chapter: Chapter;
  /** Запись главы в очереди или скачанном; нет — глава не скачана. */
  download: DownloadRow | undefined;
  /** Список глав ветки, где стоит строка, и ключ его запроса — уходят в снимок тайтла. */
  chaptersList: ChaptersResponse;
  chaptersListKey: string;
};

/**
 * Иконка состояния скачивания в строке главы (C2e): ↓ — скачать, часы — в очереди, кольцо со
 * счётчиком страниц — качается, галочка — скачана (меню удаления), «!» — ошибка (повтор). Клик по
 * часам и кольцу отменяет. Значки — насыщенными цветами. Без сети у не скачанной главы —
 * перечёркнутое облако (D2).
 */
function ChapterDownloadControl({
  titleId,
  chapter,
  download,
  chaptersList,
  chaptersListKey,
}: Props) {
  const { online } = useNetwork();
  const { data: user } = useCurrentUser();
  const { data: details } = useTitleDetails({ titleId });

  if (!user || !isDownloadSupported()) return null;

  const userId = user.id;
  const act = (action: () => unknown) => (event: MouseEvent) => {
    stopRowClick(event);
    void action();
  };
  const handleDelete = act(() => deleteDownloads(userId, [chapter.id]));

  if (download?.status === DOWNLOAD_STATUS.DONE) {
    return <DownloadedChapterMenu onDelete={handleDelete} />;
  }

  if (!online) return <OfflineChapterIcon />;

  switch (download?.status) {
    case DOWNLOAD_STATUS.FAILED:
      return (
        <FailedDownloadButton
          error={download.error}
          onRetry={act(() => retryDownloads(userId, [chapter.id]))}
        />
      );
    case DOWNLOAD_STATUS.QUEUED:
      return <QueuedDownloadButton onCancel={handleDelete} />;
    case DOWNLOAD_STATUS.DOWNLOADING:
      return (
        <DownloadProgressButton
          pagesDone={download.pagesDone}
          pagesTotal={download.pagesTotal}
          onCancel={handleDelete}
        />
      );
  }

  return (
    <DownloadChapterButton
      disabled={!details}
      onDownload={act(
        () =>
          details &&
          enqueueChapters({
            userId,
            details,
            chapters: [chapter],
            numbering: chaptersList.numbering,
            chaptersList,
            chaptersListKey,
          }),
      )}
    />
  );
}

export default ChapterDownloadControl;
