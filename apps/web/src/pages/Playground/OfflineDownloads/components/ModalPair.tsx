import { Group, Stack, Text } from '@mantine/core';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import { FREE_SPACE_MB, LOW_FREE_SPACE_MB } from '../mocks';
import { DOWNLOAD_SCOPE, type ModalPicker } from '../models';
import DownloadChaptersForm from './DownloadChaptersForm';
import ModalFrame from './ModalFrame';

type Props = {
  picker: ModalPicker;
};

/** Вариант модалки дважды: места хватает и места мало (выбраны все главы). */
function ModalPair({ picker }: Props) {
  return (
    <Group align="flex-start" gap="lg">
      <Stack gap={6}>
        <Text fz={12} c="dimmed" ff="monospace">
          Места хватает
        </Text>
        <ModalFrame title="Скачать главы" tone={MODAL_TONE.NEUTRAL} icon={DownloadSimpleIcon}>
          <DownloadChaptersForm picker={picker} freeMb={FREE_SPACE_MB} />
        </ModalFrame>
      </Stack>
      <Stack gap={6}>
        <Text fz={12} c="dimmed" ff="monospace">
          Места мало
        </Text>
        <ModalFrame title="Скачать главы" tone={MODAL_TONE.NEUTRAL} icon={DownloadSimpleIcon}>
          <DownloadChaptersForm
            picker={picker}
            freeMb={LOW_FREE_SPACE_MB}
            initialScope={DOWNLOAD_SCOPE.ALL}
          />
        </ModalFrame>
      </Stack>
    </Group>
  );
}

export default ModalPair;
