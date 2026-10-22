import { Button, Stack, Text } from '@mantine/core';
import { CloudSlashIcon, TrayArrowDownIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import styles from '../OfflineDownloads.module.scss';

type Props = {
  withDownloadsLink: boolean;
};

/** Конец главы в читалке без сети, когда следующая не скачана: вместо «Следующая глава». */
function ReaderEndMock({ withDownloadsLink }: Props) {
  return (
    <Stack gap="sm" align="center" p="xl" className={styles.readerEnd}>
      <Text fz={12} ff="monospace" c="inherit">
        Конец главы 86
      </Text>
      <CloudSlashIcon size={24} />
      <Text fz="sm" c="inherit" ta="center">
        Следующая глава не скачана
      </Text>
      {withDownloadsLink ? (
        <Button
          component={Link}
          to="#"
          variant="default"
          size="xs"
          leftSection={<TrayArrowDownIcon />}
        >
          Открыть загрузки
        </Button>
      ) : (
        <Text fz={12} c="inherit" ta="center" opacity={0.7}>
          Откроется, когда появится сеть
        </Text>
      )}
    </Stack>
  );
}

export default ReaderEndMock;
