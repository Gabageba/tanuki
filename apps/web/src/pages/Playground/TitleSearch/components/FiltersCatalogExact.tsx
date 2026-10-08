import { useState } from 'react';
import { Stack } from '@mantine/core';
import { PRESET_FILTERS } from '../models';
import CatalogLikeSettings from './CatalogLikeSettings';
import ResultsPreview from './ResultsPreview';

/** F6 — фильтры ровно как в каталоге, над куском выдачи. */
function FiltersCatalogExact() {
  const [filters, setFilters] = useState(PRESET_FILTERS);

  return (
    <Stack gap="md">
      <CatalogLikeSettings filters={filters} onChange={setFilters} />
      <ResultsPreview />
    </Stack>
  );
}

export default FiltersCatalogExact;
