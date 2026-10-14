import { Fragment, useState } from 'react';
import { Button, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
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
import { PauseIcon, PlayIcon } from '@phosphor-icons/react';
import { QUEUE_ITEMS } from '../mocks';
import {
  DOWNLOAD_ERROR,
  DOWNLOAD_STATUS,
  QUEUE_REORDER,
  QUEUE_STATE,
  type MockQueueItem,
  type QueueReorder,
  type QueueState,
} from '../models';
import QueueQuotaAlert from './QueueQuotaAlert';
import QueueRow from './QueueRow';
import QueueRowActions from './QueueRowActions';
import SortableQueueRow from './SortableQueueRow';

type Props = {
  reorder: QueueReorder;
  queueState: QueueState;
};

/** У кончившегося места текущая глава падает с `quota`, остальные ждут. */
const getInitialItems = (queueState: QueueState): MockQueueItem[] =>
  queueState === QUEUE_STATE.QUOTA
    ? QUEUE_ITEMS.map((item, index) =>
        index === 0
          ? { ...item, status: DOWNLOAD_STATUS.FAILED, error: DOWNLOAD_ERROR.QUOTA }
          : item,
      )
    : QUEUE_ITEMS;

/** Блок «Очередь» на странице «Загрузки»: шапка с паузой всей очереди и список. */
function QueueBlock({ reorder, queueState }: Props) {
  const [items, setItems] = useState(() => getInitialItems(queueState));
  const [isPaused, setIsPaused] = useState(queueState !== QUEUE_STATE.RUNNING);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const currentCount = items[0]?.status === DOWNLOAD_STATUS.DOWNLOADING ? 1 : 0;

  const moveTop = (id: string) =>
    setItems((current) => {
      const item = current.find((entry) => entry.id === id);
      if (!item) return current;
      const rest = current.filter((entry) => entry.id !== id);
      return [...rest.slice(0, currentCount), item, ...rest.slice(currentCount)];
    });
  const cancel = (id: string) => setItems((current) => current.filter((item) => item.id !== id));
  const retry = (id: string) =>
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: DOWNLOAD_STATUS.QUEUED, error: undefined } : item,
      ),
    );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setItems((current) => {
      const from = current.findIndex((item) => item.id === active.id);
      const to = Math.max(
        currentCount,
        current.findIndex((item) => item.id === over.id),
      );
      return arrayMove(current, from, to);
    });
  };

  const renderActions = (item: MockQueueItem, index: number) => (
    <QueueRowActions
      item={item}
      reorder={reorder}
      isTopmost={index <= currentCount}
      onMoveTop={() => moveTop(item.id)}
      onCancel={() => cancel(item.id)}
      onRetry={() => retry(item.id)}
    />
  );

  return (
    <Stack gap="sm">
      <Group justify="space-between" gap="sm">
        <Group gap="xs">
          <Title order={4}>Очередь</Title>
          <Text c="dimmed" ff="monospace" fz="sm">
            {items.length}
          </Text>
        </Group>
        <Button
          variant="default"
          size="xs"
          leftSection={isPaused ? <PlayIcon /> : <PauseIcon />}
          onClick={() => setIsPaused((paused) => !paused)}
        >
          {isPaused ? 'Продолжить загрузки' : 'Приостановить загрузки'}
        </Button>
      </Group>
      {queueState === QUEUE_STATE.QUOTA && isPaused && <QueueQuotaAlert />}
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        {reorder === QUEUE_REORDER.DRAG ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item, index) => (
                <Fragment key={item.id}>
                  {index > 0 && <Divider />}
                  <SortableQueueRow
                    item={item}
                    isPaused={isPaused}
                    isLocked={index < currentCount}
                    actions={renderActions(item, index)}
                  />
                </Fragment>
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          items.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 && <Divider />}
              <QueueRow item={item} isPaused={isPaused} actions={renderActions(item, index)} />
            </Fragment>
          ))
        )}
      </Paper>
    </Stack>
  );
}

export default QueueBlock;
