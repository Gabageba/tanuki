import { SimpleGrid, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { ProfileRow } from '../models';
import DeleteDownloadedModal from './DeleteDownloadedModal';
import ProfileStorageMock from './ProfileStorageMock';

type Props = {
  variant: ProfileRow;
};

/** Вариант блока «Хранилище» рядом: есть скачанное и ничего не скачано. */
function ProfileStoragePair({ variant }: Props) {
  const [isDeleteOpened, { open, close }] = useDisclosure(false);

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" maw={1100}>
      <Stack gap={6}>
        <Text fz={12} c="dimmed" ff="monospace">
          Есть скачанное
        </Text>
        <ProfileStorageMock variant={variant} hasDownloads onDelete={open} />
      </Stack>
      <Stack gap={6}>
        <Text fz={12} c="dimmed" ff="monospace">
          Ничего не скачано
        </Text>
        <ProfileStorageMock variant={variant} hasDownloads={false} onDelete={open} />
      </Stack>
      <DeleteDownloadedModal opened={isDeleteOpened} onClose={close} />
    </SimpleGrid>
  );
}

export default ProfileStoragePair;
