import { Group, Stack, Text } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';
import type { MockUser } from '../models';

type Props = {
  user: MockUser;
};

/** Регистрация и последний вход — двумя строками в одной ячейке. */
function DatesCell({ user }: Props) {
  const { formatDateNumeric, formatRelative } = useDateFormat();

  return (
    <Stack gap={2}>
      <Group gap={4} wrap="nowrap">
        <Text fz="xs" c="dimmed">
          Регистрация
        </Text>
        <Text fz="xs" ff="monospace">
          {formatDateNumeric(user.createdAt)}
        </Text>
      </Group>
      <Group gap={4} wrap="nowrap">
        <Text fz="xs" c="dimmed">
          Вход
        </Text>
        {user.lastSeenAt ? (
          <Text fz="xs">{formatRelative(user.lastSeenAt)}</Text>
        ) : (
          <Mdash fz="xs" c="dimmed" />
        )}
      </Group>
    </Stack>
  );
}

export default DatesCell;
