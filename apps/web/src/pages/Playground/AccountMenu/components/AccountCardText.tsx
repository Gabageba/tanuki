import { Group, Stack, Text } from '@mantine/core';
import { isStaffRole } from '@tanuki/contracts';
import RoleBadge from '../../InvitesTable/components/RoleBadge';
import type { MockUser } from '../models';

type Props = {
  user: MockUser;
  withRole?: boolean;
};

/** Имя (и роль персонала бейджем) над почтой моноширинным; обе строки обрезаются многоточием. */
function AccountCardText({ user, withRole = false }: Props) {
  return (
    <Stack gap={2} miw={0} flex={1}>
      <Group gap={6} wrap="nowrap" miw={0}>
        <Text fz="sm" fw={500} c="var(--mantine-color-text)" lh="tight" truncate>
          {user.username}
        </Text>
        {withRole && isStaffRole(user.role) && <RoleBadge role={user.role} size="xs" />}
      </Group>
      <Text ff="monospace" fz="xs" c="dimmed" lh="tight" truncate>
        {user.email}
      </Text>
    </Stack>
  );
}

export default AccountCardText;
