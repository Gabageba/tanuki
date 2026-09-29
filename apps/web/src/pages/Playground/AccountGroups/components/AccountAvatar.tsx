import { Avatar, Indicator } from '@mantine/core';
import { UserIcon } from '@phosphor-icons/react';
import { getStateColor } from '../lib';
import { ACCOUNT_STATE, DEMO_LOGIN, type AccountState } from '../models';

type Props = {
  state: AccountState;
  size?: number;
};

/** Аватар аккаунта: пустой пунктирный кружок, пока не вошли, инициалы логина и точка статуса — после. */
function AccountAvatar({ state, size = 32 }: Props) {
  if (state === ACCOUNT_STATE.NONE) {
    return (
      <Avatar
        size={size}
        variant="transparent"
        color="gray"
        style={{ border: '1px dashed var(--mantine-color-default-border)' }}
      >
        <UserIcon size={size * 0.5} />
      </Avatar>
    );
  }

  return (
    <Indicator
      color={getStateColor(state)}
      size={10}
      offset={4}
      position="bottom-end"
      withBorder
      processing={state === ACCOUNT_STATE.RELOGIN}
    >
      <Avatar size={size} name={DEMO_LOGIN} color="initials" />
    </Indicator>
  );
}

export default AccountAvatar;
