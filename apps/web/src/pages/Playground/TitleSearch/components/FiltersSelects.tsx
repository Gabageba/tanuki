import { useContext, useState } from 'react';
import { SimpleGrid, Stack } from '@mantine/core';
import { BooksIcon, CircleHalfIcon, ShapesIcon } from '@phosphor-icons/react';
import type { TitleState, TitleType } from '@tanuki/contracts';
import CompactMultiSelect from '@/shared/ui/CompactMultiSelect';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { STATE_OPTIONS, TYPE_OPTIONS } from '../lib';
import { MOCK_SEARCHABLE_SOURCES } from '../mocks';
import { PRESET_FILTERS } from '../models';
import FilterPills from './FilterPills';
import ResultsPreview from './ResultsPreview';

const SOURCE_OPTIONS = MOCK_SEARCHABLE_SOURCES.map(({ id, title }) => ({
  value: id,
  label: title,
}));

/** F3 — три `CompactMultiSelect` в строку над выдачей, выбор применяется сразу. */
function FiltersSelects() {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const [filters, setFilters] = useState(PRESET_FILTERS);

  return (
    <Stack gap="sm">
      <SimpleGrid cols={isPhone ? 1 : 3} spacing="xs" maw={isPhone ? undefined : 720}>
        <CompactMultiSelect
          leftSection={<BooksIcon />}
          placeholder="Источники"
          aria-label="Источники"
          data={SOURCE_OPTIONS}
          value={filters.sources}
          onChange={(sources) => setFilters({ ...filters, sources })}
          clearable
        />
        <CompactMultiSelect
          leftSection={<ShapesIcon />}
          placeholder="Тип"
          aria-label="Тип"
          data={TYPE_OPTIONS}
          value={filters.types}
          onChange={(types) => setFilters({ ...filters, types: types as TitleType[] })}
          clearable
        />
        <CompactMultiSelect
          leftSection={<CircleHalfIcon />}
          placeholder="Статус"
          aria-label="Статус"
          data={STATE_OPTIONS}
          value={filters.states}
          onChange={(states) => setFilters({ ...filters, states: states as TitleState[] })}
          clearable
        />
      </SimpleGrid>
      {isPhone && <FilterPills filters={filters} onChange={setFilters} />}
      <ResultsPreview />
    </Stack>
  );
}

export default FiltersSelects;
