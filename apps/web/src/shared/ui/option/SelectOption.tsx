import { Group, type ComboboxItem, type ComboboxLikeRenderOptionInput } from '@mantine/core';
import { CheckIcon } from '@phosphor-icons/react';

type Props = ComboboxLikeRenderOptionInput<ComboboxItem>;

function SelectOption({ option, checked }: Props) {
  return (
    <Group justify="space-between" w="100%">
      {option.label}
      {checked && <CheckIcon color="var(--mantine-primary-color-filled)" />}
    </Group>
  );
}

export default SelectOption;
