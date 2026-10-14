import { Button, Group, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { TrashIcon } from '@phosphor-icons/react';
import { formatSize, getChaptersSize } from '../lib';
import { DOWNLOADED_TITLES } from '../mocks';
import DeleteDownloadedModal from './DeleteDownloadedModal';

const TOTAL_MB = DOWNLOADED_TITLES.reduce((sum, title) => sum + getChaptersSize(title.chapters), 0);

/** Шапка блока «Скачанное»: общий объём и удаление всего. */
function DownloadedHeader() {
  const [isDeleteOpened, { open, close }] = useDisclosure(false);

  return (
    <Group justify="space-between" gap="sm">
      <Group gap="xs">
        <Title order={4}>Скачанное</Title>
        <Text c="dimmed" ff="monospace" fz="sm">
          {formatSize(TOTAL_MB)}
        </Text>
      </Group>
      <Button variant="muted" color="red" size="xs" leftSection={<TrashIcon />} onClick={open}>
        Удалить все скачанные главы
      </Button>
      <DeleteDownloadedModal opened={isDeleteOpened} onClose={close} />
    </Group>
  );
}

export default DownloadedHeader;
