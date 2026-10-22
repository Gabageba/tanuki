import { useLiveQuery } from 'dexie-react-hooks';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { getOfflineDb } from '../db';
import { DOWNLOAD_STATUS } from '../models';

const EMPTY = { count: 0, bytes: 0, rowCount: 0 };

/** Сколько глав скачано до конца и сколько они занимают; `rowCount` — все записи, очередь тоже.
 *  `undefined` — база ещё не ответила. */
function useDownloadsTotal() {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useLiveQuery(async () => {
    if (!userId) return EMPTY;
    try {
      const rows = await getOfflineDb(userId).downloads.toArray();
      const done = rows.filter((row) => row.status === DOWNLOAD_STATUS.DONE);
      return {
        count: done.length,
        bytes: done.reduce((sum, row) => sum + row.bytes, 0),
        rowCount: rows.length,
      };
    } catch {
      return EMPTY;
    }
  }, [userId]);
}

export default useDownloadsTotal;
