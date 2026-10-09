import { Radio } from '@mantine/core';
import type { FilterOption } from '@tanuki/contracts';

type Props = {
  option: FilterOption;
  checked: boolean;
  onChange: () => void;
};

function RadioFilterOption({ option, checked, onChange }: Props) {
  return (
    <Radio
      checked={checked}
      onChange={onChange}
      label={option.title}
      title={option.title}
      w="100%"
      styles={{
        labelWrapper: {
          flex: 1,
          minWidth: 0,
        },
        label: {
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      }}
    />
  );
}

export default RadioFilterOption;
