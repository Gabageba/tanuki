import { Checkbox } from '@mantine/core';
import { useMemo } from 'react';
import type { FilterOption } from '@tanuki/contracts';
import { OPTION_VALUE, type OptionValue } from '../../utils/filterSelection';
import styles from './CatalogFilter.module.scss';

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

  return (
    <Checkbox
      checked={value === OPTION_VALUE.INCLUDE}
      indeterminate={value === OPTION_VALUE.EXCLUDE}
      color={value === OPTION_VALUE.EXCLUDE ? 'red' : 'terracotta'}
      onChange={handleChange}
      label={option.title}
      key={option.key}
      w="100%"
      className={styles.checkboxFilterOption}
      styles={{
        labelWrapper: {
          flex: 1,
        },
        label: {
          flex: 1,
        },
      }}
    />
  );
}

export default CheckboxFilterOption;
