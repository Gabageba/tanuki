import { Button, Group, Stack } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { BooksIcon, BookOpenIcon, FastForwardIcon } from '@phosphor-icons/react';
import { BRANCH_READ_UP_TO, BRANCH_TOTAL } from '../mocks';
import type { DownloadFormValues } from '../models';
import RangeFields from './RangeFields';

type Props = {
  form: UseFormReturnType<DownloadFormValues>;
};

/** M3 — всегда диапазон; кнопки-пресеты только заполняют поля. */
function RangePresets({ form }: Props) {
  const setRange = (from: number, to: number) => form.setValues({ from, to });
  const firstUnread = BRANCH_READ_UP_TO + 1;

  return (
    <Stack gap="xs">
      <Group gap={6}>
        <Button
          size="compact-sm"
          variant="default"
          leftSection={<BooksIcon />}
          onClick={() => setRange(1, BRANCH_TOTAL)}
        >
          Все главы
        </Button>
        <Button
          size="compact-sm"
          variant="default"
          leftSection={<BookOpenIcon />}
          onClick={() => setRange(firstUnread, BRANCH_TOTAL)}
        >
          Непрочитанные
        </Button>
        <Button
          size="compact-sm"
          variant="default"
          leftSection={<FastForwardIcon />}
          onClick={() => setRange(firstUnread, firstUnread + 9)}
        >
          Следующие 10
        </Button>
      </Group>
      <RangeFields form={form} />
    </Stack>
  );
}

export default RangePresets;
