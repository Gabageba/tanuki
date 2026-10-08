import { useContext, useState } from 'react';
import { Box, Group, Paper, Stack } from '@mantine/core';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { countFilters } from '../lib';
import { PRESET_FILTERS } from '../models';
import FilterGroupsStack from './FilterGroupsStack';
import FilterPills from './FilterPills';
import FiltersButton from './FiltersButton';
import ResultsPreview from './ResultsPreview';

/** F1 — постоянная колонка слева, выбор применяется сразу; на телефоне — кнопка и drawer. */
function FiltersSidebar() {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const [filters, setFilters] = useState(PRESET_FILTERS);

  if (isPhone) {
    return (
      <Stack gap="sm">
        <FiltersButton count={countFilters(filters)} />
        <FilterPills filters={filters} onChange={setFilters} />
        <ResultsPreview />
      </Stack>
    );
  }

  return (
    <Group align="flex-start" gap="lg" wrap="nowrap">
      <Paper withBorder radius="md" p="md" w={230} flex="none">
        <FilterGroupsStack filters={filters} onChange={setFilters} />
      </Paper>
      <Stack gap="sm" flex={1} miw={0}>
        <FilterPills filters={filters} onChange={setFilters} />
        <Box>
          <ResultsPreview />
        </Box>
      </Stack>
    </Group>
  );
}

export default FiltersSidebar;
