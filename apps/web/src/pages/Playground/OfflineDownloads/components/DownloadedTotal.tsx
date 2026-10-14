import { Text } from '@mantine/core';
import { formatChaptersCount, formatSize } from '../lib';

type Props = {
  hasDownloads: boolean;
};

/** «42 гл. · 1,8 ГБ» моноширинным; ничего не скачано — словами. */
function DownloadedTotal({ hasDownloads }: Props) {
  if (!hasDownloads) {
    return (
      <Text span fz={12} c="dimmed">
        Ничего не скачано
      </Text>
    );
  }
  return (
    <Text span fz={12} c="dimmed" ff="monospace">
      {formatChaptersCount(42)} · {formatSize(1800)}
    </Text>
  );
}

export default DownloadedTotal;
