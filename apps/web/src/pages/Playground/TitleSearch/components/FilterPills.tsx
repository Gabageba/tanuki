import { Button, Group, Pill, Text } from '@mantine/core';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import OtherItemsTag from '@/shared/ui/OtherItemsTag';
import { getStateLabel, getTypeLabel } from '../lib';
import { MOCK_SEARCHABLE_SOURCES } from '../mocks';
import { EMPTY_FILTERS, type SearchFilters } from '../models';

type Props = {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
};

/** Выбранное над выдачей — пилюля на группу, как `CatalogFilterPills`: первое значение и «+N». */
function FilterPills({ filters, onChange }: Props) {
  const groups = [
    {
      key: 'sources' as const,
      title: 'Источники',
      labels: filters.sources.map(
        (id) => MOCK_SEARCHABLE_SOURCES.find((source) => source.id === id)?.title ?? id,
      ),
    },
    { key: 'types' as const, title: 'Тип', labels: filters.types.map(getTypeLabel) },
    { key: 'states' as const, title: 'Статус', labels: filters.states.map(getStateLabel) },
  ].filter(({ labels }) => labels.length > 0);

  if (!groups.length) {
    return null;
  }

  return (
    <Group gap="xs">
      {groups.map(({ key, title, labels }) => (
        <Pill
          key={key}
          variant="muted"
          size="md"
          withRemoveButton
          onRemove={() => onChange({ ...filters, [key]: [] })}
        >
          <Group gap={0} wrap="nowrap">
            <Text span fz="sm">
              {title}:
            </Text>
            <Text span fz="sm" ml={4}>
              {labels[0]}
            </Text>
            <OtherItemsTag count={labels.length - 1} />
          </Group>
        </Pill>
      ))}
      <Button
        variant="subtle"
        color="gray"
        size="compact-sm"
        leftSection={<ArrowCounterClockwiseIcon />}
        onClick={() => onChange(EMPTY_FILTERS)}
      >
        Сбросить
      </Button>
    </Group>
  );
}

export default FilterPills;
