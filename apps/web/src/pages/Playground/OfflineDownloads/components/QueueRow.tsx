import type { ReactNode } from 'react';
import { Group, Stack, Text } from '@mantine/core';
import { getDownloadErrorLabel } from '../lib';
import { DOWNLOAD_STATUS, type MockQueueItem } from '../models';
import QueueStatusIcon from './QueueStatusIcon';

type Props = {
  item: MockQueueItem;
  isPaused: boolean;
  /** Ручка перетаскивания слева (Q2). */
  handle?: ReactNode;
  actions: ReactNode;
};

/** Строка очереди: значок, тайтл и глава, у текущей — страницы, у ошибки — причина. */
function QueueRow({ item, isPaused, handle, actions }: Props) {
  const isCurrent = item.status === DOWNLOAD_STATUS.DOWNLOADING;

  return (
    <Stack gap={6} px="sm" py="xs">
      <Group gap="sm" wrap="nowrap">
        {handle}
        <QueueStatusIcon item={item} isPaused={isPaused} />
        <Stack gap={2} flex={1} miw={0}>
          <Text fz="sm" truncate="end">
            {item.titleName}
          </Text>
          <Group gap={6} wrap="nowrap">
            <Text fz={12} c="dimmed" flex="none">
              {item.chapterLabel}
            </Text>
            {isCurrent && (
              <Text fz={12} c="dimmed" ff="monospace">
                {item.pagesDone}/{item.pagesTotal}
              </Text>
            )}
            {isCurrent && isPaused && (
              <Text fz={12} c="dimmed">
                на паузе
              </Text>
            )}
            {item.error && (
              <Text fz={12} c="red" truncate="end">
                {getDownloadErrorLabel(item.error)}
              </Text>
            )}
          </Group>
        </Stack>
        {actions}
      </Group>
    </Stack>
  );
}

export default QueueRow;
