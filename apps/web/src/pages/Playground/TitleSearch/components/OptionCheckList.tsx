import { Checkbox, Stack } from '@mantine/core';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (value: T[]) => void;
};

/** «Тип» или «Статус» чекбоксами. */
function OptionCheckList<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <Checkbox.Group value={value} onChange={(next) => onChange(next as T[])}>
      <Stack gap={8}>
        {options.map((option) => (
          <Checkbox key={option.value} value={option.value} label={option.label} />
        ))}
      </Stack>
    </Checkbox.Group>
  );
}

export default OptionCheckList;
