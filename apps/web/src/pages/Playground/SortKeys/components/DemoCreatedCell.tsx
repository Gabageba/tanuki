import { Stack, Text } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';
import type { MockInvite } from '../../InvitesTable/models';
import type { ValueProps } from '../models';

type Props = {
  invite: MockInvite;
  authorProps: ValueProps;
  dateProps: ValueProps;
};

/** «Создал» приглашений: автор и дата создания, каждое можно выделить. */
function DemoCreatedCell({ invite, authorProps, dateProps }: Props) {
  const { formatDateNumeric } = useDateFormat();

  return (
    <Stack gap={2}>
      {invite.createdBy ? (
        <Text fz="sm" truncate maw={200} title={invite.createdBy} {...authorProps}>
          {invite.createdBy}
        </Text>
      ) : (
        <Mdash fz="sm" c="dimmed" />
      )}
      <Text fz="xs" c="dimmed" ff="monospace" {...dateProps}>
        {formatDateNumeric(invite.createdAt)}
      </Text>
    </Stack>
  );
}

export default DemoCreatedCell;
