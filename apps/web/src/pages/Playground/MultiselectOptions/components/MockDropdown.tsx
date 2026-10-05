import { Combobox, Paper, ScrollArea, Stack, Text, useCombobox } from '@mantine/core';
import SelectOption from '@/shared/ui/option/SelectOption';
import { getOptionClassName, getOptionsClassName } from '../lib';
import type { MockList, OptionFocus, OptionLook } from '../models';

type Props = {
  list: MockList;
  look: OptionLook;
  focus: OptionFocus;
};

/** Раскрытый список в застывшем состоянии: настоящие Combobox.Option с теми же атрибутами, что
 *  ставит Mantine, — data-checked у выбранных, data-combobox-selected у пункта под курсором. */
function MockDropdown({ list, look, focus }: Props) {
  const store = useCombobox();
  const optionClassName = getOptionClassName(look, focus);

  return (
    <Stack gap={6}>
      <Text fz="xs" c="dimmed">
        {list.title}
      </Text>
      <Combobox store={store}>
        <Paper withBorder shadow="md" p={4} w="100%" maw={260}>
          <ScrollArea.Autosize mah={220} type="always" offsetScrollbars>
            <Combobox.Options className={getOptionsClassName(look)}>
              {list.options.map((option) => (
                <Combobox.Option
                  key={option.value}
                  value={option.value}
                  selected={option.focused}
                  data-checked={option.checked || undefined}
                  data-hover={option.hovered || undefined}
                  className={optionClassName}
                >
                  <SelectOption option={option} checked={option.checked} />
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </ScrollArea.Autosize>
        </Paper>
      </Combobox>
    </Stack>
  );
}

export default MockDropdown;
