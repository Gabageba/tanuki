import type { ReactNode } from 'react';
import { ActionIcon, Box } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { DownloadItem } from '../models';
import QueueRow from './QueueRow';
import styles from '../Downloads.module.scss';

type Props = {
  item: DownloadItem;
  isPaused: boolean;
  /** Текущую главу не двигают — она уже качается. */
  isLocked: boolean;
  actions: ReactNode;
};

/** Строка очереди с ручкой перетаскивания (Q2), с клавиатуры тоже. */
function SortableQueueRow({ item, isPaused, isLocked, actions }: Props) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.row.chapterId,
    disabled: isLocked,
  });

  return (
    <Box
      ref={setNodeRef}
      pos="relative"
      bg="body"
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
            aria-label={t('changeOrder')}
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
