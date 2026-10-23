import { Group, Text } from '@mantine/core';
import { NBSP } from '../../LibraryBackup/lib';
import { hasProgressDiff } from '../lib';
import { PROGRESS_VIEW, type ImportItem, type ProgressView } from '../models';

type Props = {
  item: ImportItem;
  progress: ProgressView;
};

/** «Гл. 42» — где остановился на сайте; в P1 рядом ваша отметка, если она другая. Сайт не отдал
 *  главу — ничего. */
function ChapterMeta({ item, progress }: Props) {
  if (item.lastChapter === null) {
    return null;
  }

  return (
    <Group gap={4} wrap="nowrap" flex="none">
      <Text ff="monospace" fz={12} c="dimmed" style={{ whiteSpace: 'nowrap' }}>
        Гл.{NBSP}
        {item.lastChapter}
      </Text>
      {progress === PROGRESS_VIEW.BOTH && hasProgressDiff(item) && (
        <Text fz={12} c="gold" style={{ whiteSpace: 'nowrap' }}>
          · у вас{' '}
          <Text span ff="monospace" inherit>
            {item.myChapter}
          </Text>
        </Text>
      )}
    </Group>
  );
}

export default ChapterMeta;
