import { Badge, Group, Stack, Text } from '@mantine/core';
import type { MockInvite } from '../models';
import RoleBadge from './RoleBadge';

type Props = {
  invite: MockInvite;
  isOwn: boolean;
};

/** T2: роль бейджем, своё помечено «Ваше», кто создал — второй строкой. */
function InviteCell({ invite, isOwn }: Props) {
  return (
    <Stack gap={4} align="flex-start" miw={0}>
      <Group gap={6} wrap="nowrap">
        <RoleBadge role={invite.role} />
        {isOwn && (
          <Badge size="xs" variant="muted" color="gray" flex="none">
            Ваше
          </Badge>
        )}
      </Group>
      <Text fz="xs" c="dimmed" truncate maw={240}>
        {invite.createdBy ? `от ${invite.createdBy}` : 'из консоли'}
      </Text>
    </Stack>
  );
}

export default InviteCell;
