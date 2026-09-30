import { ActionIcon, Button, Menu } from '@mantine/core';
import { DotsThreeVerticalIcon, LinkBreakIcon, SignInIcon } from '@phosphor-icons/react';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import { ACCOUNT_STATE, type AccountState } from '../models';

type Props = {
  state: AccountState;
};

function AccountAction({ state }: Props) {
  switch (state) {
    case ACCOUNT_STATE.NONE:
      return (
        <Button variant="light" size="xs" leftSection={<SignInIcon />}>
          Войти
        </Button>
      );
    case ACCOUNT_STATE.RELOGIN:
      return (
        <Button
          variant="light"
          color={STATUS_DEGRADED_COLOR}
          size="xs"
          leftSection={<SignInIcon />}
        >
          Войти заново
        </Button>
      );
    case ACCOUNT_STATE.ACTIVE:
      return (
        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="default" aria-label="Действия">
              <DotsThreeVerticalIcon />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item color="red" leftSection={<LinkBreakIcon />}>
              Отвязать
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      );
  }
}

export default AccountAction;
