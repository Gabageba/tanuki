import { useContext, useState } from 'react';
import { Group, ScrollArea, Stack } from '@mantine/core';
import { BooksIcon, CircleHalfIcon, ShapesIcon } from '@phosphor-icons/react';
import type { TitleState, TitleType } from '@tanuki/contracts';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { STATE_OPTIONS, TYPE_OPTIONS } from '../lib';
import { PRESET_FILTERS } from '../models';
import FilterMenuButton from './FilterMenuButton';
import FilterPills from './FilterPills';
import OptionCheckList from './OptionCheckList';
import ResultsPreview from './ResultsPreview';
import SourceCheckList from './SourceCheckList';

/** F5 — три кнопки-дропдауна, как у маркетплейсов; на телефоне ряд листается вбок. */
function FiltersMenus() {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const [filters, setFilters] = useState(PRESET_FILTERS);

  const buttons = (
    <Group gap="xs" wrap="nowrap">
      <FilterMenuButton<string>
        title="Источники"
        icon={<BooksIcon />}
        value={filters.sources}
        onApply={(sources) => setFilters({ ...filters, sources })}
        renderList={(draft, setDraft) => <SourceCheckList value={draft} onChange={setDraft} />}
      />
      <FilterMenuButton<TitleType>
        title="Тип"
        icon={<ShapesIcon />}
        value={filters.types}
        onApply={(types) => setFilters({ ...filters, types })}
        renderList={(draft, setDraft) => (
          <OptionCheckList options={TYPE_OPTIONS} value={draft} onChange={setDraft} />
        )}
      />
      <FilterMenuButton<TitleState>
        title="Статус"
        icon={<CircleHalfIcon />}
        value={filters.states}
        onApply={(states) => setFilters({ ...filters, states })}
        renderList={(draft, setDraft) => (
          <OptionCheckList options={STATE_OPTIONS} value={draft} onChange={setDraft} />
        )}
      />
    </Group>
  );

  return (
    <Stack gap="sm">
      {isPhone ? (
        <ScrollArea type="never" mx="-sm" px="sm">
          {buttons}
        </ScrollArea>
      ) : (
        buttons
      )}
      <FilterPills filters={filters} onChange={setFilters} />
      <ResultsPreview />
    </Stack>
  );
}

export default FiltersMenus;
