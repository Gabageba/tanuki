import { SimpleGrid, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PROFILE_ROW, SETTINGS_LAYOUT } from '../../models';
import DeleteDownloadedModal from '../DeleteDownloadedModal';
import ProfileStorageMock from '../ProfileStorageMock';
import SettingsDownloadsMock from '../SettingsDownloadsMock';

/** Итог в профиле и настройках: две строки P2 и вкладка S2a. */
function FinalSettings() {
  const [isDeleteOpened, { open, close }] = useDisclosure(false);

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" maw={1240}>
      <Stack gap={6}>
        <Text fz={12} c="dimmed" ff="monospace">
          Профиль → Данные
        </Text>
        <ProfileStorageMock variant={PROFILE_ROW.SPLIT} hasDownloads onDelete={open} />
      </Stack>
      <Stack gap={6}>
        <Text fz={12} c="dimmed" ff="monospace">
          Настройки → Загрузки
        </Text>
        <SettingsDownloadsMock layout={SETTINGS_LAYOUT.SPLIT_WIDE} />
      </Stack>
      <DeleteDownloadedModal opened={isDeleteOpened} onClose={close} />
    </SimpleGrid>
  );
}

export default FinalSettings;
