import { Group, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ManagedUser } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import LastSeen from './LastSeen';

type Props = {
  user: ManagedUser;
};

/** Регистрация и последний вход — двумя строками в одной ячейке. */
function UserDatesCell({ user }: Props) {
  const { t } = useTranslation();
  const { formatDateNumeric } = useDateFormat();

  return (
    <Stack gap={2}>
      <Group gap={4} wrap="nowrap">
        <Text fz="xs" c="dimmed">
          {t('registration')}
        </Text>
        <Text fz="xs" ff="monospace">
          {formatDateNumeric(user.createdAt)}
        </Text>
      </Group>
      <Group gap={4} wrap="nowrap">
        <Text fz="xs" c="dimmed">
          {t('login')}
        </Text>
        <LastSeen lastSeenAt={user.lastSeenAt} fz="xs" />
      </Group>
    </Stack>
  );
}

export default UserDatesCell;
