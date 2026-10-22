import { Alert, Text } from '@mantine/core';
import { HardDrivesIcon } from '@phosphor-icons/react';

/** Очередь встала: кончилось место. Что делать — освободить место и продолжить. */
function QueueQuotaAlert() {
  return (
    <Alert
      variant="muted"
      color="red"
      icon={<HardDrivesIcon />}
      title="Кончилось место на устройстве"
    >
      <Text fz={13}>
        Загрузки приостановлены. Удалите ненужные скачанные главы ниже и нажмите «Продолжить
        загрузки».
      </Text>
    </Alert>
  );
}

export default QueueQuotaAlert;
