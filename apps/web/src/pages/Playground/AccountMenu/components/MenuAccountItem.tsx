import { Menu } from '@mantine/core';
import { CaretRightIcon } from '@phosphor-icons/react';
import UserAvatar from './UserAvatar';
import AccountCardText from './AccountCardText';
import type { MockUser } from '../models';

type Props = {
  user: MockUser;
};

/** Карточка аккаунта пунктом меню: вся строка ведёт в профиль, на это указывает стрелка. */
function MenuAccountItem({ user }: Props) {
  return (
    <Menu.Item
      leftSection={<UserAvatar user={user} size={36} />}
      rightSection={<CaretRightIcon size={14} color="var(--mantine-color-dimmed)" />}
    >
      <AccountCardText user={user} />
    </Menu.Item>
  );
}

export default MenuAccountItem;
