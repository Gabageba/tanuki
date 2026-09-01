import type { ComboboxOptionProps } from '@mantine/core';
import { Combobox } from '@mantine/core';
import SelectOption from './SelectOption';

type Props = { label: string } & ComboboxOptionProps;

function ComboboxOption({ label, value, selected }: Props) {
  return (
    <Combobox.Option value={value} selected={selected} className="selectableOption">
      <SelectOption
        checked={selected}
        option={{
          value: value as string,
          label,
        }}
      />
    </Combobox.Option>
  );
}

export default ComboboxOption;
