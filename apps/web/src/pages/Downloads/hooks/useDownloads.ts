import { useLiveQuery } from 'dexie-react-hooks';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { getOfflineDb } from '@/entities/download/db';
import { QUEUE_STATE_ID } from '@/entities/download/models';
import { isDownloadSupported } from '@/entities/download/queue';
import type { DownloadsData } from '../models';

/** Очередь и скачанное пользователя, живые: прогресс воркера приходит сам. `undefined` — база ещё
 *  не ответила, `null` — скачивание в этом браузере недоступно. */
function useDownloads() {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useLiveQuery(async (): Promise<DownloadsData | null | undefined> => {
    if (!userId) return undefined;
    if (!isDownloadSupported()) return null;
    try {
      const db = getOfflineDb(userId);
      const [rows, titles, chapters, state] = await Promise.all([
        db.downloads.toArray(),
        db.titles.toArray(),
        db.chapters.toArray(),
        db.queue.get(QUEUE_STATE_ID),
      ]);
      return {
        rows,
        titles: new Map(titles.map((title) => [title.titleId, title])),
        chapters: new Map(chapters.map((chapter) => [chapter.chapterId, chapter])),
        isPaused: state?.isPaused ?? false,
      };
    } catch {
      // IndexedDB есть, но не открывается — так бывает в приватном окне.
      return null;
    }
  }, [userId]);
}

export default useDownloads;
