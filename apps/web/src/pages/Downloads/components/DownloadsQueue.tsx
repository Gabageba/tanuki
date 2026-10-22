import { Fragment, useState } from 'react';
import { Button, Divider, EmptyState, Paper, Stack } from '@mantine/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ClockIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { DOWNLOAD_STATUS } from '@/entities/download/models';
import {
  deleteDownloads,
  reorderDownloads,
  retryDownloads,
  setDownloadsPaused,
} from '@/entities/download/queue';
import { getQueueItems, isOrderSettled } from '../lib';
import type { DownloadsData } from '../models';
import DownloadsSectionHeader from './DownloadsSectionHeader';
import QueueQuotaAlert from './QueueQuotaAlert';
import QueueRowActions from './QueueRowActions';
import SortableQueueRow from './SortableQueueRow';

type Props = {
  userId: string;
  data: DownloadsData;
};

/** Вкладка «Очередь»: пауза всей очереди, порядок перетаскиванием, отмена и повтор. */
function DownloadsQueue({ userId, data }: Props) {
  const { t } = useTranslation();
  // Порядок после перетаскивания держим сами, пока база не отдала новый, — иначе строка на миг
  // прыгнет обратно: живой запрос перечитывает базу уже после того, как запись завершилась.
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const queueItems = getQueueItems(data);
  // Качающуюся главу база всегда ставит первой — её место с перетаскиванием не сверяем.
  const movableIds = queueItems
    .filter((item) => item.row.status !== DOWNLOAD_STATUS.DOWNLOADING)
    .map((item) => item.row.chapterId);
  if (pendingOrder && isOrderSettled(pendingOrder, movableIds)) {
    setPendingOrder(null);
  }
  const items = pendingOrder
    ? [
        ...pendingOrder.flatMap((id) => queueItems.find((item) => item.row.chapterId === id) ?? []),
        // Встали в очередь, пока ждали базу.
        ...queueItems.filter((item) => !pendingOrder.includes(item.row.chapterId)),
      ]
    : queueItems;

  if (items.length === 0) {
    return (
      <EmptyState
        title={t('queueIsEmpty')}
        description={t('everythingInQueueDownloaded')}
        icon={<ClockIcon />}
      />
    );
  }

  const lockedCount = items[0]?.row.status === DOWNLOAD_STATUS.DOWNLOADING ? 1 : 0;

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = items.map((item) => item.row.chapterId);
    const from = ids.indexOf(String(active.id));
    const to = Math.max(lockedCount, ids.indexOf(String(over.id)));
    const next = arrayMove(ids, from, to);
    setPendingOrder(next);
    try {
      await reorderDownloads(userId, next);
    } catch (error) {
      setPendingOrder(null);
      throw error;
    }
  };

  return (
    <Stack gap="sm">
      <DownloadsSectionHeader
        title={t('queue')}
        meta={items.length}
        action={
          <Button
            variant="default"
            size="xs"
            leftSection={data.isPaused ? <PlayIcon /> : <PauseIcon />}
            onClick={() => void setDownloadsPaused(userId, !data.isPaused)}
          >
            {data.isPaused ? t('resumeDownloads') : t('pauseDownloads')}
          </Button>
        }
      />
      <QueueQuotaAlert rows={data.rows} isPaused={data.isPaused} />
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <SortableContext
            items={items.map((item) => item.row.chapterId)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item, index) => (
              <Fragment key={item.row.chapterId}>
                {index > 0 && <Divider />}
                <SortableQueueRow
                  item={item}
                  isPaused={data.isPaused}
                  isLocked={index < lockedCount}
                  actions={
                    <QueueRowActions
                      row={item.row}
                      onRetry={() => void retryDownloads(userId, [item.row.chapterId])}
                      onCancel={() => void deleteDownloads(userId, [item.row.chapterId])}
                    />
                  }
                />
              </Fragment>
            ))}
          </SortableContext>
        </DndContext>
      </Paper>
    </Stack>
  );
}

export default DownloadsQueue;
