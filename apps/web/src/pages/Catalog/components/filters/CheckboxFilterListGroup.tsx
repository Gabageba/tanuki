import type { ScrollAreaAutosizeProps } from '@mantine/core';
import { ScrollArea, SimpleGrid } from '@mantine/core';
import { FILTER_TYPE, type FilterGroup, type FilterSelection } from '@tanuki/contracts';
import CheckboxFilterOption from './CheckboxFilterOption';
import { getOptionValue, setOptionValue } from '../../utils/filterSelection';

type Props = {
  group: FilterGroup;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
  scrollAreaProps?: ScrollAreaAutosizeProps;
};

function CheckboxFilterListGroup({ group, selection, onChange, scrollAreaProps = {} }: Props) {
  return (
    <ScrollArea.Autosize flex={1} mih={0} type="auto" offsetScrollbars="y" {...scrollAreaProps}>
      <SimpleGrid cols={{ base: 1, xs: 2 }}>
        {group.options.map((option) => (
          <CheckboxFilterOption
            option={option}
            key={option.key}
            withExclude={group.type === FILTER_TYPE.CHECKBOX_EXCLUDE}
            value={getOptionValue(selection, group.id, option.key)}
            onChange={(value) => onChange(setOptionValue(selection, group.id, option.key, value))}
          />
        ))}
      </SimpleGrid>
    </ScrollArea.Autosize>
  );
}

export default CheckboxFilterListGroup;
