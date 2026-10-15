import type { ReactNode } from 'react';
import { Group, Stack, Text } from '@mantine/core';
import type { MockFolder } from '../../Bookmarks/models';
import PhoneFrame from '../../Bookmarks/components/PhoneFrame';
import { BUILT_IN_FOLDERS, MIXED_FOLDERS } from '../mocks';

type Props = {
  /** Список папок в варианте — для каждого из трёх состояний свой набор. */
  render: (folders: MockFolder[]) => ReactNode;
};

/** Один вариант в трёх состояниях рядом: свои вперемешку со встроенными, только встроенные,
 *  телефон. */
function VariantStates({ render }: Props) {
  return (
    <Group align="flex-start" gap="xl">
      <Stack gap={6} w={560} maw="100%">
        <Text fz={12} c="dimmed">
          Свои и встроенные
        </Text>
        {render(MIXED_FOLDERS)}
      </Stack>
      <Stack gap={6} w={560} maw="100%">
        <Text fz={12} c="dimmed">
          Только встроенные
        </Text>
        {render(BUILT_IN_FOLDERS)}
      </Stack>
      <PhoneFrame label="360 px" width={360}>
        {render(MIXED_FOLDERS)}
      </PhoneFrame>
    </Group>
  );
}

export default VariantStates;
