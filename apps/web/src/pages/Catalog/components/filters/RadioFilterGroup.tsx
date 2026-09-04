import type { ScrollAreaAutosizeProps } from '@mantine/core';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import VirtualizedRadioGrid from './VirtualizedRadioGrid';
import { getRadioValue, setRadioValue } from '../../utils/filterSelection';

type Props = {
  group: FilterGroup;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
  scrollAreaProps?: ScrollAreaAutosizeProps;
};

function RadioFilterGroup({ group, selection, onChange, scrollAreaProps }: Props) {
  const value = getRadioValue(selection, group.id);

  return (
    <VirtualizedRadioGrid
      options={group.options}
      value={value}
      onChange={(key) => onChange(setRadioValue(selection, group.id, key))}
      scrollAreaProps={scrollAreaProps}
    />
  );
}

export default RadioFilterGroup;
