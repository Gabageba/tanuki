import { Stack, Text } from '@mantine/core';
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
import { useTranslation } from 'react-i18next';
import type { SourcesResponse } from '@tanuki/contracts';
import SourceLoginBadgeLegend from '@/entities/source/components/SourceLoginBadge/SourceLoginBadgeLegend';
import { flattenSources, getPresentSourceLoginMarks } from '@/entities/source/lib';
import GroupedList from '@/shared/ui/GroupedList';
import useReorderSources from './hooks/useReorderSources';
import { isSourceLoginOffered } from './lib';
import SourceToggleRow from './SourceToggleRow';

type Props = {
  data: SourcesResponse;
};

/** Источники в общем порядке: перетаскиваются и выключаются. */
function SettingsSourcesList({ data }: Props) {
  const { t } = useTranslation();
  const reorderSources = useReorderSources();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sources = flattenSources(data);
  const sourceIds = sources.map((source) => source.id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = sourceIds.indexOf(String(active.id));
    const to = sourceIds.indexOf(String(over.id));
    reorderSources.mutate(arrayMove(sourceIds, from, to));
  };

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Text c="dimmed">{t('sourcesOrderIsUsedInListsSearchAndMatches')}</Text>
        <Text c="dimmed">{t('disabledSourcesAreHidden')}</Text>
      </Stack>
      <Stack maw={640} gap={4}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sourceIds} strategy={verticalListSortingStrategy}>
            <GroupedList label={t('sources')}>
              {sources.map((source) => (
                <SourceToggleRow key={source.id} source={source} />
              ))}
            </GroupedList>
          </SortableContext>
        </DndContext>
        <SourceLoginBadgeLegend
          marks={getPresentSourceLoginMarks(sources.filter(isSourceLoginOffered))}
        />
      </Stack>
    </Stack>
  );
}

export default SettingsSourcesList;
