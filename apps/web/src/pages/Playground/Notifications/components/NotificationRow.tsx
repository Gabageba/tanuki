import { ActionIcon, Badge, Box, Group, Stack, Text } from '@mantine/core';
import { XIcon } from '@phosphor-icons/react';
import { getChaptersText, getNotificationDetail, getNotificationTitle } from '../lib';
import { COUNTER, MOCK_TYPE, type Counter, type Leading, type MockNotification } from '../models';
import NotificationLeading from './NotificationLeading';
import styles from '../Notifications.module.scss';

type Props = {
  item: MockNotification;
  leading: Leading;
  counter: Counter;
  /** Клик по строке: переход к цели и прочитано. */
  onOpen: () => void;
  /** Крестик: убрать без перехода. */
  onRemove: () => void;
};

/** Строка ленты: слева обложка/иконка, заголовок, вторая строка с уточнением и временем,
 *  справа «×». */
function NotificationRow({ item, leading, counter, onOpen, onRemove }: Props) {
  const isChapters = item.type === MOCK_TYPE.NEW_CHAPTERS && item.count !== null;
  const detail = isChapters
    ? counter === COUNTER.WORDS
      ? getChaptersText(item.count ?? 0)
      : 'Новые главы'
    : getNotificationDetail(item);

  return (
    <Group wrap="nowrap" align="center" gap="xs">
      <Group
        wrap="nowrap"
        align="center"
        gap="sm"
        flex={1}
        miw={0}
        p="xs"
        className={styles.rowLegacy}
        onClick={onOpen}
      >
        <NotificationLeading item={item} leading={leading} />
        <Stack gap={2} flex={1} miw={0}>
          <Text fz="sm" fw={500} lineClamp={2}>
            {getNotificationTitle(item)}
          </Text>
          <Text fz={12} c="dimmed" lineClamp={2}>
            {detail ? `${detail} · ${item.ago}` : item.ago}
          </Text>
        </Stack>
        {isChapters && counter === COUNTER.PILL && (
          <Badge variant="muted" ff="monospace" flex="none">
            +{item.count}
          </Badge>
        )}
      </Group>
      <Box flex="none">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          aria-label="Убрать уведомление"
          onClick={onRemove}
        >
          <XIcon size={14} />
        </ActionIcon>
      </Box>
    </Group>
  );
}

export default NotificationRow;
