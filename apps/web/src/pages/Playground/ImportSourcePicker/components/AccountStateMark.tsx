import { Box, Group, Text } from '@mantine/core';
import { getAccountStateColor } from '../../SourcesSetup/lib';
import { getAccountStateIcon } from '../../SourcesSetup/components/lib';
import type { AccountState } from '../../SourcesSetup/models';
import { getShortStateLabel } from '../lib';

type Props = {
  state: AccountState;
};

/** Состояние входа иконкой и словами: «не выполнен» и «войдите заново» различаются и цветом. */
function AccountStateMark({ state }: Props) {
  const color = getAccountStateColor(state);

  return (
    <Group gap={4} wrap="nowrap">
      <Box c={color} fz={14} lh={0}>
        {getAccountStateIcon(state)}
      </Box>
      <Text fz={12} c={color} lh={1.2} truncate>
        {getShortStateLabel(state)}
      </Text>
    </Group>
  );
}

export default AccountStateMark;
