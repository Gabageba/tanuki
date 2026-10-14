import { Button, Group, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import DeleteDownloadsModal from '@/features/download/DeleteDownloadsModal';
import { formatSize } from '@/shared/lib/formatSize';

type Props = {
  bytes: number;
};

/** Шапка «Скачанного»: общий объём и удаление всего. */
function DownloadedHeader({ bytes }: Props) {
  const { t, i18n } = useTranslation();
  const [isDeleteOpened, { open, close }] = useDisclosure(false);

  return (
    <Group justify="space-between" gap="sm">
      <Group gap="xs">
        <Title order={4}>{t('downloaded')}</Title>
        <Text c="dimmed" ff="monospace" fz="sm">
          {formatSize(bytes, t, i18n.language)}
        </Text>
      </Group>
      <Button variant="muted" color="red" size="xs" leftSection={<TrashIcon />} onClick={open}>
        {t('deleteAllDownloadedChapters')}
      </Button>
      <DeleteDownloadsModal opened={isDeleteOpened} onClose={close} />
    </Group>
  );
}

export default DownloadedHeader;
