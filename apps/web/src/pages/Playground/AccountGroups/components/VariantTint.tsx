import type { ReactNode } from 'react';
import { Box, Text } from '@mantine/core';
import { CheckCircleIcon, UserCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { getMutedBackground, PRIMARY_COLOR } from '@/shared/lib/palette';
import { getStateColor, getStateLabel } from '../lib';
import {
  ACCOUNT_STATE,
  DEMO_LOGIN,
  DEMO_SOURCES,
  type AccountState,
  type VariantProps,
} from '../models';
import AccountAction from './AccountAction';
import DemoGroup from './DemoGroup';
import DemoSourceRow from './DemoSourceRow';
import HeaderLayout from './HeaderLayout';

const getStateIcon = (state: AccountState): ReactNode => {
  switch (state) {
    case ACCOUNT_STATE.NONE:
      return <UserCircleIcon />;
    case ACCOUNT_STATE.ACTIVE:
      return <CheckCircleIcon weight="fill" />;
    case ACCOUNT_STATE.RELOGIN:
      return <WarningCircleIcon weight="fill" />;
  }
};

type Props = VariantProps & {
  /** H3a: «не привязан» тоже подкрашен — акцентным цветом, а не серым. */
  isAccentWhenUnlinked?: boolean;
  /** H3b: фон всегда серый, цвет состояния остаётся только у иконки и заголовка. */
  isGrayBackground?: boolean;
};

/** H3 — вся шапка подкрашена цветом состояния: нейтральная, зелёная или золотая. */
function VariantTint({ state, isAccentWhenUnlinked = false, isGrayBackground = false }: Props) {
  const isLinked = state !== ACCOUNT_STATE.NONE;
  const isTinted = isLinked || isAccentWhenUnlinked;
  const color = isLinked ? getStateColor(state) : PRIMARY_COLOR;

  return (
    <DemoGroup>
      <HeaderLayout
        bg={
          isTinted && !isGrayBackground
            ? getMutedBackground(color, true)
            : 'var(--mantine-color-default-hover)'
        }
        icon={
          <Box c={isTinted ? `${color}.6` : 'dimmed'} fz={24} lh={0}>
            {getStateIcon(state)}
          </Box>
        }
        title={
          <Text fw={600} lh={1} c={isTinted ? `${color}.6` : undefined}>
            {isLinked ? getStateLabel(state) : 'Аккаунт не привязан'}
          </Text>
        }
        description={
          <Text fz={12} c="dimmed" lh={1.2} ff={isLinked ? 'monospace' : undefined} truncate>
            {isLinked ? DEMO_LOGIN : 'Один вход для всех источников ниже'}
          </Text>
        }
        action={<AccountAction state={state} />}
      />
      {DEMO_SOURCES.map((source) => (
        <DemoSourceRow key={source.id} source={source} />
      ))}
    </DemoGroup>
  );
}

export default VariantTint;
