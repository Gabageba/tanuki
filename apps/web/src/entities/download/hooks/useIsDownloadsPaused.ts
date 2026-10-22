import { useLiveQuery } from 'dexie-react-hooks';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { getOfflineDb } from '../db';
import { QUEUE_STATE_ID } from '../models';

/** Стоит ли вся очередь на паузе — флаг в базе, переживает перезапуск. */
function useIsDownloadsPaused() {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return (
    useLiveQuery(async () => {
      if (!userId) return false;
      try {
        return (await getOfflineDb(userId).queue.get(QUEUE_STATE_ID))?.isPaused ?? false;
      } catch {
        return false;
      }
    }, [userId]) ?? false
  );
}

export default useIsDownloadsPaused;
