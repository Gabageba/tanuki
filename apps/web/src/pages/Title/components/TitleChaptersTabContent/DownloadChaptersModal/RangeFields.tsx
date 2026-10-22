import { Group, NumberInput } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { ArrowLineDownIcon, ArrowLineUpIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { DownloadChaptersFormValues } from './models';

type Props = {
  form: UseFormReturnType<DownloadChaptersFormValues>;
};

/** «С главы … по главу …» — номера в нумерации ветки. */
function RangeFields({ form }: Props) {
  const { t } = useTranslation();

  return (
    <Group gap="xs" grow align="flex-start">
      <NumberInput
        placeholder={t('fromChapter')}
        aria-label={t('fromChapter')}
        leftSection={<ArrowLineUpIcon />}
        min={0}
        {...form.getInputProps('from')}
      />
      <NumberInput
        placeholder={t('toChapter')}
        aria-label={t('toChapter')}
        leftSection={<ArrowLineDownIcon />}
        min={0}
        {...form.getInputProps('to')}
      />
    </Group>
  );
}

export default RangeFields;
