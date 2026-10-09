import type { CheckboxProps } from '@mantine/core';
import { Checkbox } from '@mantine/core';
import { useMemo } from 'react';
import type { FilterOption } from '@tanuki/contracts';
import { OPTION_VALUE, type OptionValue } from './lib/filterSelection';
import CheckboxMinusIcon from '@/shared/ui/icons/CheckboxMinusIcon';
import CheckboxPlusIcon from '@/shared/ui/icons/CheckboxPlusIcon';

type Props = {
  option: FilterOption;
  withExclude: boolean;
  value: OptionValue;
  onChange: (value: OptionValue) => void;
};

function CheckboxFilterOption({ option, withExclude, value, onChange }: Props) {
  const optionValues = useMemo(
    () => [OPTION_VALUE.NONE, OPTION_VALUE.INCLUDE, ...(withExclude ? [OPTION_VALUE.EXCLUDE] : [])],
    [withExclude],
  );

  const handleChange = () => {
    const idx = optionValues.findIndex((v) => v === value);

    onChange(
      idx + 1 >= optionValues.length
        ? (optionValues[0] as OptionValue)
        : (optionValues[idx + 1] as OptionValue),
    );
  };

  const checkboxProps: Pick<CheckboxProps, 'checked' | 'color' | 'icon'> = useMemo(() => {
    if (value === OPTION_VALUE.EXCLUDE) {
      return {
        checked: true,
        color: 'red',
        icon: CheckboxMinusIcon,
      };
    }
    if (value === OPTION_VALUE.INCLUDE) {
      return {
        checked: true,
        color: withExclude ? 'green' : 'terracotta',
        icon: withExclude ? CheckboxPlusIcon : undefined,
      };
    }

    return {
      checked: false,
      color: withExclude ? 'green' : 'terracotta',
    };
  }, [withExclude, value]);

  return (
    <Checkbox
      {...checkboxProps}
      onChange={handleChange}
      label={option.title}
      title={option.title}
      key={option.key}
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

export default CheckboxFilterOption;
