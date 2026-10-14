import { Alert, Group } from '@mantine/core';
import { HardDrivesIcon } from '@phosphor-icons/react';
import MidDotGroup from '@/shared/ui/MidDotGroup';

/** B0 — плашка как сейчас: захардкожена и видна у любого тайтла. */
function PlateLegacy() {
  return (
    <Alert variant="transparent" px={10} py={0}>
      <Group gap={8} c="dimmed">
        <HardDrivesIcon size={16} />
        <MidDotGroup
          separatorProps={{ c: 'dimmed', fz: 12 }}
          text={{ c: 'dimmed', fz: 12 }}
          items={['Скачано 42 гл.', '1,8 ГБ']}
        />
      </Group>
    </Alert>
  );
}

export default PlateLegacy;
