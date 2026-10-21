import type { ScrollAreaAutosizeProps } from '@mantine/core';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import VirtualizedCheckboxGrid from './VirtualizedCheckboxGrid';
import { getOptionValue, isExcludableGroup, setOptionValue } from './lib/filterSelection';

type Props = {
  group: FilterGroup;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
  scrollAreaProps?: ScrollAreaAutosizeProps;
};

function CheckboxFilterListGroup({ group, selection, onChange, scrollAreaProps }: Props) {
  return (
    <VirtualizedCheckboxGrid
      options={group.options}
      withExclude={isExcludableGroup(group)}
      getValue={(key) => getOptionValue(selection, group.id, key)}
      onChange={(key, value) => onChange(setOptionValue(selection, group.id, key, value))}
      scrollAreaProps={scrollAreaProps}
    />
  );
}

export default CheckboxFilterListGroup;
