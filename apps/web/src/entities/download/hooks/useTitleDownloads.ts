import { useLiveQuery } from 'dexie-react-hooks';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { getOfflineDb } from '../db';
import type { DownloadRow } from '../models';

const EMPTY: ReadonlyMap<string, DownloadRow> = new Map();

/** Записи очереди и скачанного одного тайтла по id главы. Живые: прогресс, который пишет service
 *  worker, приходит сюда сам. `undefined` — база ещё не ответила. */
function useTitleDownloads(titleId: string) {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useLiveQuery(async (): Promise<ReadonlyMap<string, DownloadRow>> => {
    if (!userId) return EMPTY;
    try {
      const rows = await getOfflineDb(userId).downloads.where('titleId').equals(titleId).toArray();
      return new Map(rows.map((row) => [row.chapterId, row]));
    } catch {
      // IndexedDB недоступна (приватное окно) — скачивания нет, и строки это покажут.
      return EMPTY;
    }
  }, [userId, titleId]);
}

export default useTitleDownloads;
