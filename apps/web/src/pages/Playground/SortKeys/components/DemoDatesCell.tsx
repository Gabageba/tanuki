import { Group, Stack, Text } from '@mantine/core';
import type { ManagedUser } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';
import type { ValueProps } from '../models';

type Props = {
  user: ManagedUser;
  createdProps: ValueProps;
  lastSeenProps: ValueProps;
};

/** Копия `UserDatesCell`: регистрация и вход двумя строками, каждую можно выделить. */
function DemoDatesCell({ user, createdProps, lastSeenProps }: Props) {
  const { formatDateNumeric, formatRelative } = useDateFormat();

  return (
    <Stack gap={2}>
      <Group gap={4} wrap="nowrap">
        <Text fz="xs" c="dimmed">
          Регистрация
        </Text>
        <Text fz="xs" ff="monospace" {...createdProps}>
          {formatDateNumeric(user.createdAt)}
        </Text>
      </Group>
      <Group gap={4} wrap="nowrap">
        <Text fz="xs" c="dimmed">
          Вход
        </Text>
        {user.lastSeenAt ? (
          <Text fz="xs" {...lastSeenProps}>
            {formatRelative(user.lastSeenAt)}
          </Text>
        ) : (
          <Mdash fz="xs" c="dimmed" />
        )}
      </Group>
    </Stack>
  );
}

export default DemoDatesCell;
