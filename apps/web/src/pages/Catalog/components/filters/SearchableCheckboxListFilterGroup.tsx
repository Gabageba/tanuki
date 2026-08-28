import type { ScrollAreaAutosizeProps } from '@mantine/core';
import { ScrollArea, SimpleGrid, Stack } from '@mantine/core';
import { useState } from 'react';
import SearchInput from '@/shared/ui/SearcInput';
import { FILTER_TYPE, type FilterGroup, type FilterSelection } from '@tanuki/contracts';
import CheckboxFilterOption from './CheckboxFilterOption';
import { getOptionValue, setOptionValue } from '../../utils/filterSelection';

type Props = {
  group: FilterGroup;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
  scrollAreaProps?: ScrollAreaAutosizeProps;
};

function SearchableCheckboxListFilterGroup({
  group,
  selection,
  onChange,
  scrollAreaProps = {},
}: Props) {
  const [query, setQuery] = useState('');

  return (
    <Stack flex={1} mih={0}>
      <SearchInput
        handleSearch={setQuery}
        debounceMs={100}
        placeholder={`Искать в "${group.title}"`}
      />
      <ScrollArea.Autosize flex={1} mih={0} type="auto" offsetScrollbars="y" {...scrollAreaProps}>
        <SimpleGrid cols={{ base: 1, xs: 2 }}>
          {group.options
            .filter((option) => option.title.toLowerCase().includes(query.toLowerCase()))
            .map((option) => (
              <CheckboxFilterOption
                key={option.key}
                option={option}
                withExclude={
                  group.type === FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE &&
                  option.excludable !== false
                }
                value={getOptionValue(selection, group.id, option.key)}
                onChange={(value) =>
                  onChange(setOptionValue(selection, group.id, option.key, value))
                }
              />
            ))}
        </SimpleGrid>
      </ScrollArea.Autosize>
    </Stack>
  );
}

export default SearchableCheckboxListFilterGroup;
