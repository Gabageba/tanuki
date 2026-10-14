import { Paper, Stack, Text } from '@mantine/core';
import Frames from '../../Notifications/components/Frames';
import type { OfflineCatalog } from '../models';
import OfflineCatalogMock from './OfflineCatalogMock';
import OfflineSearchMock from './OfflineSearchMock';

type Props = {
  variant: OfflineCatalog;
};

/** Вариант оси K: каталог в двух ширинах и поиск на десктопе. */
function OfflineCatalogVariant({ variant }: Props) {
  return (
    <Stack gap="md">
      <Frames>
        <OfflineCatalogMock variant={variant} />
      </Frames>
      <Stack gap={6} maw={900}>
        <Text fz={12} c="dimmed" ff="monospace">
          Поиск, десктоп
        </Text>
        <Paper withBorder radius="lg" p="md">
          <OfflineSearchMock variant={variant} />
        </Paper>
      </Stack>
    </Stack>
  );
}

export default OfflineCatalogVariant;
