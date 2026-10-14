import { ActionIcon, Group, Menu, Tooltip } from '@mantine/core';
import {
  ArrowCounterClockwiseIcon,
  ArrowLineUpIcon,
  DotsThreeIcon,
  XIcon,
} from '@phosphor-icons/react';
import { DOWNLOAD_STATUS, QUEUE_REORDER, type MockQueueItem, type QueueReorder } from '../models';

type Props = {
  item: MockQueueItem;
  reorder: QueueReorder;
  /** Поднимать некуда: это текущая глава или первая после неё. */
  isTopmost: boolean;
  onMoveTop: () => void;
  onCancel: () => void;
  onRetry: () => void;
};

/** Действия строки очереди. Q1 — меню «⋯» с «Поднять наверх»; Q2 — крестик отмены (порядок
 *  меняет ручка). Повтор ошибки в обоих — отдельной кнопкой. */
function QueueRowActions({ item, reorder, isTopmost, onMoveTop, onCancel, onRetry }: Props) {
  const isFailed = item.status === DOWNLOAD_STATUS.FAILED;

  return (
    <Group gap={4} wrap="nowrap" flex="none">
      {isFailed && (
        <Tooltip label="Повторить загрузку главы">
          <ActionIcon variant="subtle" color="gray" onClick={onRetry}>
            <ArrowCounterClockwiseIcon />
          </ActionIcon>
        </Tooltip>
      )}
      {reorder === QUEUE_REORDER.MENU ? (
        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" aria-label="Действия с главой">
              <DotsThreeIcon />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<ArrowLineUpIcon />} disabled={isTopmost} onClick={onMoveTop}>
              Поднять наверх
            </Menu.Item>
            <Menu.Item color="red" leftSection={<XIcon />} onClick={onCancel}>
              Отменить загрузку главы
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ) : (
        <Tooltip label="Отменить загрузку главы">
          <ActionIcon variant="subtle" color="gray" onClick={onCancel}>
            <XIcon />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}

export default QueueRowActions;
