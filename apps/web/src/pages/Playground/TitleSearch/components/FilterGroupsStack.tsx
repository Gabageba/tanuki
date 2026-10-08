import { Stack, Text } from '@mantine/core';
import { STATE_OPTIONS, TYPE_OPTIONS } from '../lib';
import type { SearchFilters } from '../models';
import OptionCheckList from './OptionCheckList';
import SourceCheckList from './SourceCheckList';

type Props = {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
};

/** Три группы фильтров столбиком — для боковой колонки и для drawer на телефоне. */
function FilterGroupsStack({ filters, onChange }: Props) {
  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <Text fz="sm" fw={600}>
          Источники
        </Text>
        <SourceCheckList
          value={filters.sources}
          onChange={(sources) => onChange({ ...filters, sources })}
        />
      </Stack>
      <Stack gap="xs">
        <Text fz="sm" fw={600}>
          Тип
        </Text>
        <OptionCheckList
          options={TYPE_OPTIONS}
          value={filters.types}
          onChange={(types) => onChange({ ...filters, types })}
        />
      </Stack>
      <Stack gap="xs">
        <Text fz="sm" fw={600}>
          Статус
        </Text>
        <OptionCheckList
          options={STATE_OPTIONS}
          value={filters.states}
          onChange={(states) => onChange({ ...filters, states })}
        />
      </Stack>
    </Stack>
  );
}

export default FilterGroupsStack;
