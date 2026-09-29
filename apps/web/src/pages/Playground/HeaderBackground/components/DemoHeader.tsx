import type { CSSProperties } from 'react';
import { Box, Group, Stack, Text, type MantineSpacing } from '@mantine/core';
import { CheckCircleIcon, UserCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { getStateLabel } from '../../AccountGroups/lib';
import { ACCOUNT_STATE, DEMO_LOGIN, type AccountState } from '../../AccountGroups/models';
import AccountAction from '../../AccountGroups/components/AccountAction';
import { getHeaderColor } from '../lib';

const getStateIcon = (state: AccountState) => {
  switch (state) {
    case ACCOUNT_STATE.NONE:
      return <UserCircleIcon />;
    case ACCOUNT_STATE.ACTIVE:
      return <CheckCircleIcon weight="fill" />;
    case ACCOUNT_STATE.RELOGIN:
      return <WarningCircleIcon weight="fill" />;
  }
};

type Props = {
  state: AccountState;
  bg?: string;
  style?: CSSProperties;
  px?: MantineSpacing;
};

/**
 * Копия `GroupedList.Header` с экрана настроек, которой можно задать фон и рамку: настоящая их не
 * принимает, а макетам нужно пробовать.
 */
function DemoHeader({ state, bg, style, px = 'md' }: Props) {
  const color = getHeaderColor(state);
  const isLinked = state !== ACCOUNT_STATE.NONE;

  return (
    <Group
      justify="space-between"
      gap="md"
      wrap="nowrap"
      px={px}
      py="xs"
      bg={bg}

      style={style}
    >
      <Group gap="md" wrap="nowrap" flex={1} miw={0}>
        <Box c={color} fz={24} lh={0}>
          {getStateIcon(state)}
        </Box>
        <Stack gap={4} miw={0}>
          <Text component="div" lh={1} fz={14} c={color}>
            {isLinked ? getStateLabel(state) : 'Аккаунт не привязан'}
          </Text>
          <Text
            component="div"
            fz={12}
            c="dimmed"
            lh={1.2}
            ff={isLinked ? 'monospace' : undefined}
            truncate
          >
            {isLinked ? DEMO_LOGIN : 'Один вход для всех источников ниже'}
          </Text>
        </Stack>
      </Group>
      <AccountAction state={state} size="xs" />
    </Group>
  );
}

export default DemoHeader;
