import { ActionIcon, Badge, Group, Stack, Text } from '@mantine/core';
import {
  getChaptersText,
  getDismissRowIcon,
  getDismissRowLabel,
  getNotificationDetail,
  getNotificationTitle,
} from '../lib';
import {
  COUNTER,
  DISMISS,
  MOCK_TYPE,
  ROW_APPEARANCE,
  type Counter,
  type Dismiss,
  type Leading,
  type MockNotification,
  type RowAppearance,
} from '../models';
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
  appearance: RowAppearance;
  dismiss?: Dismiss;
};

const getRowClassName = (appearance: RowAppearance) => {
  switch (appearance) {
    case ROW_APPEARANCE.SQUARE:
      return styles.rowSquare;
    case ROW_APPEARANCE.ROUNDED:
      return styles.rowRounded;
    case ROW_APPEARANCE.CARD:
      return styles.rowCard;
  }
};

/** Вариация строки: подсветка и «×» на всю строку, вид (без скруглений, скруглённая, карточка) —
 *  по `appearance`. Исходная строка — `NotificationRow`. */
function NotificationRowWhole({
  item,
  leading,
  counter,
  onOpen,
  onRemove,
  appearance,
  dismiss = DISMISS.CURRENT,
}: Props) {
  const isChapters = item.type === MOCK_TYPE.NEW_CHAPTERS && item.count !== null;
  const detail = isChapters
    ? counter === COUNTER.WORDS
      ? getChaptersText(item.count ?? 0)
      : 'Новые главы'
    : getNotificationDetail(item);

  return (
    <Group
      wrap="nowrap"
      align="center"
      gap="sm"
      p="sm"
      className={getRowClassName(appearance)}
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
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        flex="none"
        aria-label={getDismissRowLabel(dismiss)}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
      >
        {getDismissRowIcon(dismiss)}
      </ActionIcon>
    </Group>
  );
}

export default NotificationRowWhole;
