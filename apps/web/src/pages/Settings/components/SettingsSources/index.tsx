import { Center, Loader, Stack, Text } from '@mantine/core';
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
import SourceLoginBadgeLegend from '@/entities/source/components/SourceLoginBadge/SourceLoginBadgeLegend';
import useSources from '@/entities/source/hooks/useSources';
import { flattenSources, getPresentSourceLoginMarks } from '@/entities/source/lib';
import GroupedList from '@/shared/ui/GroupedList';
import useReorderSources from './hooks/useReorderSources';
import { isSourceLoginOffered } from './lib';
import SourceToggleRow from './SourceToggleRow';

function SettingsSources() {
  const { t } = useTranslation();
  const { data, isPending } = useSources();
  const reorderSources = useReorderSources();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (isPending) {
    return (
      <Center mt="lg">
        <Loader />
      </Center>
    );
  }

  const sources = flattenSources(data);
  const sourceIds = sources.map((source) => source.id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = sourceIds.indexOf(String(active.id));
    const to = sourceIds.indexOf(String(over.id));
    reorderSources.mutate(arrayMove(sourceIds, from, to));
  };

  return (
    <Stack mt="lg" gap="lg">
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

export default SettingsSources;
