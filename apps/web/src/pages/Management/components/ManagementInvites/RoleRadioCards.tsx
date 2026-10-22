import { Badge, Paper, Radio, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { INVITABLE_ROLE, type InvitableRole } from '@tanuki/contracts';
import { getUserRoleColor, getUserRoleLabel } from '@/entities/user/lib';
import RadioCardOption from '@/shared/ui/RadioCardOption';
import { getInvitableRoleDescription } from './models';

type Props = {
  roles: InvitableRole[];
  value: InvitableRole;
  onChange: (role: InvitableRole) => void;
};

const isInvitableRole = (value: string): value is InvitableRole =>
  Object.values(INVITABLE_ROLE).some((role) => role === value);

/** Роль — карточками с тем, что она даёт. Роль одна (у модератора) — та же карточка без выбора. */
function RoleRadioCards({ roles, value, onChange }: Props) {
  const { t } = useTranslation();
  const [single] = roles;

  if (roles.length === 1 && single) {
    return (
      <Paper withBorder radius="md" p="md">
        <Stack gap={4} align="flex-start">
          <Badge color={getUserRoleColor(single)} variant="muted">
            {getUserRoleLabel(single, t)}
          </Badge>
          <Text fz="sm" c="dimmed">
            {getInvitableRoleDescription(single, t)}
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Radio.Group value={value} onChange={(next) => isInvitableRole(next) && onChange(next)}>
      <Stack gap="xs">
        {roles.map((role) => (
          <RadioCardOption
            key={role}
            value={role}
            title={getUserRoleLabel(role, t)}
            description={getInvitableRoleDescription(role, t)}
          />
        ))}
      </Stack>
    </Radio.Group>
  );
}

export default RoleRadioCards;
