import { Stack, Switch, Text } from '@mantine/core';
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
import type { HomeSectionInfo, Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import GroupedList from '@/shared/ui/GroupedList';
import SelectionsSectionItem from './SelectionsSectionItem';

type Props = {
  source: Source;
  sections: HomeSectionInfo[];
  isSourceOn: boolean;
  isSectionOn: (sectionId: string) => boolean;
  onSourceChange: (isOn: boolean) => void;
  onSectionChange: (sectionId: string, isOn: boolean) => void;
  onSectionsReorder: (sectionIds: string[]) => void;
};

/**
 * Строка источника (T1a): как во вкладке «Источники», только без ручки перетаскивания — порядок
 * источников меняют там. Переключатель «Показывать в подборках», под ним галочки блоков одной
 * колонкой в порядке пользователя; блоки перетаскиваются за ручку. Выключен источник — галочки
 * и ручки гаснут, но выбор и порядок в них сохраняются.
 */
function SelectionsSourceRow({
  source,
  sections,
  isSourceOn,
  isSectionOn,
  onSourceChange,
  onSectionChange,
  onSectionsReorder,
}: Props) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const sectionIds = sections.map((section) => section.id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = sectionIds.indexOf(String(active.id));
    const to = sectionIds.indexOf(String(over.id));
    onSectionsReorder(arrayMove(sectionIds, from, to));
  };

  return (
    <GroupedList.Row
      icon={<SourceIcon id={source.id} title={source.title} size={32} />}
      title={
        <Text fz={14} lh="tight" truncate>
          {source.title}
        </Text>
      }
      description={
        <Text fz={12} lh="tight" c="dimmed" ff="monospace" truncate>
          {source.domain}
        </Text>
      }
      action={
        <Switch
          checked={isSourceOn}
          onChange={(event) => onSourceChange(event.currentTarget.checked)}
          aria-label={t('showSourceInSelections', { source: source.title })}
        />
      }
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          <Stack gap={8}>
            {sections.map((section) => (
              <SelectionsSectionItem
                key={section.id}
                section={section}
                isOn={isSectionOn(section.id)}
                disabled={!isSourceOn}
                onChange={(isOn) => onSectionChange(section.id, isOn)}
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>
    </GroupedList.Row>
  );
}

export default SelectionsSourceRow;
