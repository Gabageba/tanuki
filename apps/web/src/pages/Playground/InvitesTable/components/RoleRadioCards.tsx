import { Badge, Group, Paper, Radio, Stack, Text } from '@mantine/core';
import { USER_ROLE, type InvitableRole } from '@tanuki/contracts';
import { getRoleColor, getRoleDescription, getRoleLabel } from '../lib';

type Props = {
  roles: InvitableRole[];
  value: InvitableRole;
  onChange: (role: InvitableRole) => void;
};

const isInvitableRole = (value: string): value is InvitableRole =>
  value === USER_ROLE.USER || value === USER_ROLE.MODERATOR;

/** C1: роль — карточками с тем, что она даёт. Роль одна (модератор) — та же карточка без выбора. */
function RoleRadioCards({ roles, value, onChange }: Props) {
  const [single] = roles;
  if (roles.length === 1 && single) {
    return (
      <Paper withBorder radius="md" p="md">
        <Stack gap={4}>
          <Badge color={getRoleColor(single)} variant="muted">
            {getRoleLabel(single)}
          </Badge>
          <Text fz="sm" c="dimmed">
            {getRoleDescription(single)}
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Radio.Group value={value} onChange={(next) => isInvitableRole(next) && onChange(next)}>
      <Stack gap="xs">
        {roles.map((role) => (
          <Radio.Card key={role} value={role} radius="md" p="md">
            <Group gap="sm" wrap="nowrap" align="flex-start">
              <Radio.Indicator mt={2} />
              <Stack gap={2}>
                <Text fz="sm" fw={600}>
                  {getRoleLabel(role)}
                </Text>
                <Text fz="sm" c="dimmed">
                  {getRoleDescription(role)}
                </Text>
              </Stack>
            </Group>
          </Radio.Card>
        ))}
      </Stack>
    </Radio.Group>
  );
}

export default RoleRadioCards;
