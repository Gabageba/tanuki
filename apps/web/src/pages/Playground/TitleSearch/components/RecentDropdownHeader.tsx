import { Button, Group, Text } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';

type Props = {
  withClear?: boolean;
};

/** Подпись «Недавние запросы» над списком, справа — «Очистить». */
function RecentDropdownHeader({ withClear = true }: Props) {
  return (
    <Group justify="space-between" px="sm" pt={6} pb={2} wrap="nowrap">
      <Text fz="xs" c="dimmed">
        Недавние запросы
      </Text>
      {withClear && (
        <Button variant="subtle" color="gray" size="compact-xs" leftSection={<TrashIcon />}>
          Очистить
        </Button>
      )}
    </Group>
  );
}

export default RecentDropdownHeader;
