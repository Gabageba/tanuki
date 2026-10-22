import { useEffect, useEffectEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetwork } from '@mantine/hooks';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { CONTINUE_READING_QUERY_KEY } from '@/entities/title/models';
import { getReadingProgressQueryKey } from '@/entities/title/hooks/useReadingProgress';
import { flushPendingProgress } from '@/entities/title/progressSync';
import useHasActiveDownloads from '@/entities/download/hooks/useHasActiveDownloads';
import { isDownloadSupported, processDownloadQueue } from '@/entities/download/queue';

/** Пока очередь не пуста, страница будит воркер: браузер останавливает его, если событий нет, а
 *  каждое сообщение продлевает ему жизнь. */
const HEARTBEAT_MS = 20_000;

/**
 * Что делает приложение, когда появляется сеть, и при каждом запуске: отправляет отметки прогресса,
 * накопленные без сети, и продолжает очередь скачивания с той же страницы. Живёт в RequireAuth,
 * чтобы работать и в читалке вне Layout.
 */
function OfflineSync() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { online } = useNetwork();
  const userId = user?.id;
  const hasActiveDownloads = useHasActiveDownloads(userId);

  const sync = useEffectEvent(async (id: string) => {
    const sentTitleIds = await flushPendingProgress(id);
    sentTitleIds.forEach((titleId) =>
      queryClient.invalidateQueries({ queryKey: getReadingProgressQueryKey(titleId) }),
    );
    if (sentTitleIds.length > 0) {
      void queryClient.invalidateQueries({ queryKey: CONTINUE_READING_QUERY_KEY });
    }
    if (isDownloadSupported()) processDownloadQueue(id);
  });

  useEffect(() => {
    if (userId && online) void sync(userId);
  }, [userId, online]);

  useEffect(() => {
    if (!userId || !online || !hasActiveDownloads) return undefined;
    const timer = setInterval(() => processDownloadQueue(userId), HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [userId, online, hasActiveDownloads]);

  return null;
}

export default OfflineSync;
