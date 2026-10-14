import { useLiveQuery } from 'dexie-react-hooks';
import { getOfflineDb } from '../db';
import { DOWNLOAD_STATUS, QUEUE_STATE_ID } from '../models';

/** Есть ли что качать прямо сейчас: очередь не пуста и не на паузе. */
function useHasActiveDownloads(userId: string | undefined) {
  return (
    useLiveQuery(async () => {
      if (!userId) return false;
      try {
        const db = getOfflineDb(userId);
        const state = await db.queue.get(QUEUE_STATE_ID);
        if (state?.isPaused) return false;
        const count = await db.downloads
          .where('status')
          .anyOf(DOWNLOAD_STATUS.QUEUED, DOWNLOAD_STATUS.DOWNLOADING)
          .count();
        return count > 0;
      } catch {
        return false;
      }
    }, [userId]) ?? false
  );
}

export default useHasActiveDownloads;
