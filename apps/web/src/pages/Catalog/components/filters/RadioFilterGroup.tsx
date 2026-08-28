import type { ScrollAreaAutosizeProps } from '@mantine/core';
import { Radio, ScrollArea, SimpleGrid } from '@mantine/core';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import { getRadioValue, setRadioValue } from '../../utils/filterSelection';

type Props = {
  group: FilterGroup;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
  scrollAreaProps?: ScrollAreaAutosizeProps;
};

function RadioFilterGroup({ group, selection, onChange, scrollAreaProps = {} }: Props) {
  const value = getRadioValue(selection, group.id);

  return (
    <ScrollArea.Autosize flex={1} mih={0} type="auto" offsetScrollbars="y" {...scrollAreaProps}>
      <Radio.Group
        value={value ?? ''}
        onChange={(key) => onChange(setRadioValue(selection, group.id, key))}
      >
        <SimpleGrid cols={{ base: 1, xs: 2 }}>
          {group.options.map((option) => (
            <Radio key={option.key} value={option.key} label={option.title} w="100%" />
          ))}
        </SimpleGrid>
      </Radio.Group>
    </ScrollArea.Autosize>
  );
}

export default RadioFilterGroup;
