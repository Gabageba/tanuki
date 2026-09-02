import type { ScrollAreaAutosizeProps } from '@mantine/core';
import { FILTER_TYPE, type FilterGroup, type FilterSelection } from '@tanuki/contracts';
import VirtualizedCheckboxGrid from './VirtualizedCheckboxGrid';
import { getOptionValue, setOptionValue } from '../../utils/filterSelection';

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
      withExclude={group.type === FILTER_TYPE.CHECKBOX_EXCLUDE}
      getValue={(key) => getOptionValue(selection, group.id, key)}
      onChange={(key, value) => onChange(setOptionValue(selection, group.id, key, value))}
      scrollAreaProps={scrollAreaProps}
    />
  );
}

export default CheckboxFilterListGroup;
