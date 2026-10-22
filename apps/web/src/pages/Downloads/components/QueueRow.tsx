import type { ReactNode } from 'react';
import { Group, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { getDownloadErrorLabel } from '@/entities/download/lib';
import { DOWNLOAD_STATUS } from '@/entities/download/models';
import { getChapterLabel } from '@/entities/title/readingProgress';
import Mdash from '@/shared/ui/Mdash';
import type { DownloadItem } from '../models';
import QueueStatusIcon from './QueueStatusIcon';

type Props = {
  item: DownloadItem;
  isPaused: boolean;
  /** Ручка перетаскивания слева. */
  handle: ReactNode;
  actions: ReactNode;
};

/** Строка очереди: значок, тайтл и глава, у текущей — страницы, у ошибки — причина. */
function QueueRow({ item, isPaused, handle, actions }: Props) {
  const { t } = useTranslation();
  const { row, title, chapter } = item;
  const isCurrent = row.status === DOWNLOAD_STATUS.DOWNLOADING;

  return (
    <Group gap="sm" wrap="nowrap" px="sm" py="xs">
      {handle}
      <QueueStatusIcon row={row} isPaused={isPaused} />
      <Stack gap={2} flex={1} miw={0}>
        <Text fz="sm" truncate="end">
          {title?.details.title.name ?? <Mdash />}
        </Text>
        <Group gap={6} wrap="nowrap">
          <Text fz="xs" c="dimmed" flex="none">
            {chapter ? getChapterLabel(chapter.chapter, chapter.numbering, t) : <Mdash />}
          </Text>
          {isCurrent && row.pagesTotal > 0 && (
            <Text fz="xs" c="dimmed" ff="monospace">
              {row.pagesDone}/{row.pagesTotal}
            </Text>
          )}
          {isCurrent && isPaused && (
            <Text fz="xs" c="dimmed">
              {t('onPause')}
            </Text>
          )}
          {row.error && (
            <Text fz="xs" c="red" truncate="end">
              {getDownloadErrorLabel(row.error, t)}
            </Text>
          )}
        </Group>
      </Stack>
      {actions}
    </Group>
  );
}

export default QueueRow;
