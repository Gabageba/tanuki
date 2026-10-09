import { useContext, useState } from 'react';
import { Chip, Group, Stack, Text } from '@mantine/core';
import { BooksIcon } from '@phosphor-icons/react';
import type { TitleState, TitleType } from '@tanuki/contracts';
import CompactMultiSelect from '@/shared/ui/CompactMultiSelect';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { STATE_OPTIONS, TYPE_OPTIONS } from '../lib';
import { MOCK_SEARCHABLE_SOURCES } from '../mocks';
import { PRESET_FILTERS } from '../models';
import ResultsPreview from './ResultsPreview';

const SOURCE_OPTIONS = MOCK_SEARCHABLE_SOURCES.map(({ id, title }) => ({
  value: id,
  label: title,
}));

/** F4 — тип и статус чипами, их видно без открытия; источники — выпадающим списком. */
function FiltersChips() {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const [filters, setFilters] = useState(PRESET_FILTERS);

  return (
    <Stack gap="sm">
      <CompactMultiSelect
        leftSection={<BooksIcon />}
        placeholder="Источники"
        aria-label="Источники"
        data={SOURCE_OPTIONS}
        value={filters.sources}
        onChange={(sources) => setFilters({ ...filters, sources })}
        clearable
        maw={isPhone ? undefined : 320}
      />
      <Group gap="xs" wrap={isPhone ? 'wrap' : 'nowrap'} align="center">
        <Text fz="sm" c="dimmed" w={56} flex="none">
          Тип
        </Text>
        <Chip.Group
          multiple
          value={filters.types}
          onChange={(types) => setFilters({ ...filters, types: types as TitleType[] })}
        >
          <Group gap={6}>
            {TYPE_OPTIONS.map(({ value, label }) => (
              <Chip key={value} value={value} size="sm" variant="outline">
                {label}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Group>
      <Group gap="xs" wrap={isPhone ? 'wrap' : 'nowrap'} align="center">
        <Text fz="sm" c="dimmed" w={56} flex="none">
          Статус
        </Text>
        <Chip.Group
          multiple
          value={filters.states}
          onChange={(states) => setFilters({ ...filters, states: states as TitleState[] })}
        >
          <Group gap={6}>
            {STATE_OPTIONS.map(({ value, label }) => (
              <Chip key={value} value={value} size="sm" variant="outline">
                {label}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Group>
      <ResultsPreview />
    </Stack>
  );
}

export default FiltersChips;
