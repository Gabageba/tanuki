import type { ScrollAreaAutosizeProps } from '@mantine/core';
import { Stack } from '@mantine/core';
import { useMemo, useState } from 'react';
import SearchInput from '@/shared/ui/SearcInput';
import { FILTER_TYPE, type FilterGroup, type FilterSelection } from '@tanuki/contracts';
import VirtualizedCheckboxGrid from './VirtualizedCheckboxGrid';
import { getOptionValue, setOptionValue } from '../../utils/filterSelection';

type Props = {
  group: FilterGroup;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
  scrollAreaProps?: ScrollAreaAutosizeProps;
};

function SearchableCheckboxListFilterGroup({ group, selection, onChange, scrollAreaProps }: Props) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return group.options.filter((option) => option.title.toLowerCase().includes(normalizedQuery));
  }, [group.options, query]);

  return (
    <Stack flex={1} mih={0}>
      <SearchInput
        handleSearch={setQuery}
        debounceMs={100}
        placeholder={`Искать в "${group.title}"`}
      />
      <VirtualizedCheckboxGrid
        options={filteredOptions}
        withExclude={group.type === FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE}
        getValue={(key) => getOptionValue(selection, group.id, key)}
        onChange={(key, value) => onChange(setOptionValue(selection, group.id, key, value))}
        scrollAreaProps={scrollAreaProps}
      />
    </Stack>
  );
}

export default SearchableCheckboxListFilterGroup;
