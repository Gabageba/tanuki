import type { ReactNode } from 'react';
import { ActionIcon, Box } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import type { MockQueueItem } from '../models';
import QueueRow from './QueueRow';
import styles from '../OfflineDownloads.module.scss';

type Props = {
  item: MockQueueItem;
  isPaused: boolean;
  /** Текущую главу не двигают — она уже качается. */
  isLocked: boolean;
  actions: ReactNode;
};

/** Q2 — строка очереди с ручкой перетаскивания. */
function SortableQueueRow({ item, isPaused, isLocked, actions }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: isLocked,
  });

  return (
    <Box
      ref={setNodeRef}
      className={styles.sortableRow}
      mod={{ dragging: isDragging }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <QueueRow
        item={item}
        isPaused={isPaused}
        actions={actions}
        handle={
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            className={styles.dragHandle}
            disabled={isLocked}
            aria-label="Изменить порядок"
            {...attributes}
            {...listeners}
          >
            <DotsSixVerticalIcon />
          </ActionIcon>
        }
      />
    </Box>
  );
}

export default SortableQueueRow;
