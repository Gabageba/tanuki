import { Group, Text } from '@mantine/core';
import MidDot from '@/shared/ui/MidDot';
import { formatChaptersCount, formatSize, getChaptersSize } from '../lib';
import type { MockDownloadedTitle } from '../models';

type Props = {
  title: MockDownloadedTitle;
  withSource?: boolean;
};

/** «Mangalib · 5 гл. · 131 МБ»: источник словом, счётчик и объём — моноширинным. */
function DownloadedTitleMeta({ title, withSource = true }: Props) {
  return (
    <Group gap={6} wrap="nowrap">
      {withSource && (
        <>
          <Text fz={12} c="dimmed" truncate="end">
            {title.source}
          </Text>
          <MidDot c="dimmed" fz={12} />
        </>
      )}
      <Text fz={12} c="dimmed" ff="monospace" flex="none">
        {formatChaptersCount(title.chapters.length)}
      </Text>
      <MidDot c="dimmed" fz={12} />
      <Text fz={12} c="dimmed" ff="monospace" flex="none">
        {formatSize(getChaptersSize(title.chapters))}
      </Text>
    </Group>
  );
}

export default DownloadedTitleMeta;
