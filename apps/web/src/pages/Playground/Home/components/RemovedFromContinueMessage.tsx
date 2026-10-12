import { Button, Group, Text } from '@mantine/core';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';

type Props = {
  onRestore: () => void;
};

/** Тост после «Убрать»: как у закладок, только кнопка — «Отменить» по плану. */
function RemovedFromContinueMessage({ onRestore }: Props) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Text fz="sm">Тайтл убран из «Продолжить чтение»</Text>
      <Button
        size="compact-sm"
        variant="subtle"
        flex="none"
        leftSection={<ArrowCounterClockwiseIcon />}
        onClick={onRestore}
      >
        Отменить
      </Button>
    </Group>
  );
}

export default RemovedFromContinueMessage;
