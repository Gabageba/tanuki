import { Group, NumberInput } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { ArrowLineDownIcon, ArrowLineUpIcon } from '@phosphor-icons/react';
import { BRANCH_TOTAL } from '../mocks';
import type { DownloadFormValues } from '../models';

type Props = {
  form: UseFormReturnType<DownloadFormValues>;
};

/** «С главы … по главу …» — номера в нумерации ветки. */
function RangeFields({ form }: Props) {
  return (
    <Group gap="xs" grow align="flex-start">
      <NumberInput
        placeholder="С главы"
        leftSection={<ArrowLineUpIcon />}
        min={1}
        max={BRANCH_TOTAL}
        allowDecimal={false}
        {...form.getInputProps('from')}
      />
      <NumberInput
        placeholder="По главу"
        leftSection={<ArrowLineDownIcon />}
        min={1}
        max={BRANCH_TOTAL}
        allowDecimal={false}
        {...form.getInputProps('to')}
      />
    </Group>
  );
}

export default RangeFields;
