import { useCallback } from 'react';
import { useNetwork } from '@mantine/hooks';
import { isDownloadDone } from '../lib';
import useTitleDownloads from './useTitleDownloads';

/** Без сети открыть можно только главы, которые скачались до конца. */
function useIsChapterUnavailable(titleId: string) {
  const { online } = useNetwork();
  const downloads = useTitleDownloads(titleId);

  return useCallback(
    (id: string) => !online && !isDownloadDone(downloads?.get(id)),
    [online, downloads],
  );
}

export default useIsChapterUnavailable;
