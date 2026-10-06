import { Menu, Text } from '@mantine/core';
import UserAvatar from './UserAvatar';
import MenuGroups from './MenuGroups';
import LogOutMenuItem from './LogOutMenuItem';
import { getVisibleGroups } from '../lib';
import { MENU_ITEM, type MockUser } from '../models';

type Props = {
  user: MockUser;
};

function M3Desktop({ user }: Props) {
  return (
    <>
      <Menu.Item leftSection={<UserAvatar user={user} size={20} />}>
        <Text inherit fw={500} truncate>
          {user.username}
        </Text>
      </Menu.Item>
      <MenuGroups
        groups={getVisibleGroups(
          [
            [MENU_ITEM.SETTINGS],
            [MENU_ITEM.SOURCES_HEALTH, MENU_ITEM.MANAGEMENT, MENU_ITEM.PLAYGROUND],
          ],
          user,
        )}
      />
      <Menu.Divider />
      <LogOutMenuItem />
    </>
  );
}

export default M3Desktop;
