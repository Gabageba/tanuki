import type { ScrollAreaAutosizeProps } from '@mantine/core';
import { Stack } from '@mantine/core';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchInput from '@/shared/ui/SearchInput';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import VirtualizedRadioGrid from './VirtualizedRadioGrid';
import { getRadioValue, setRadioValue } from './lib/filterSelection';

type Props = {
  group: FilterGroup;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
  scrollAreaProps?: ScrollAreaAutosizeProps;
};

function SearchableRadioFilterGroup({ group, selection, onChange, scrollAreaProps }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return group.options.filter((option) => option.title.toLowerCase().includes(normalizedQuery));
  }, [group.options, query]);

  const value = getRadioValue(selection, group.id);

  return (
    <Stack flex={1} mih={0}>
      <SearchInput
        handleSearch={setQuery}
        debounceMs={100}
        placeholder={t('searchIn', { title: group.title })}
      />
      <VirtualizedRadioGrid
        options={filteredOptions}
        value={value}
        onChange={(key) => onChange(setRadioValue(selection, group.id, key))}
        scrollAreaProps={scrollAreaProps}
      />
    </Stack>
  );
}

export default SearchableRadioFilterGroup;
