import { Menu } from '@mantine/core';
import MenuGroups from './MenuGroups';
import LogOutMenuItem from './LogOutMenuItem';
import { getVisibleGroups } from '../lib';
import { MENU_ITEM, type MockUser } from '../models';

type Props = {
  user: MockUser;
};

function M0Desktop({ user }: Props) {
  const groups = getVisibleGroups(
    [[MENU_ITEM.PROFILE, MENU_ITEM.MANAGEMENT, MENU_ITEM.PLAYGROUND, MENU_ITEM.SETTINGS]],
    user,
  );

  return (
    <>
      <Menu.Label>{user.username}</Menu.Label>
      <MenuGroups groups={groups} />
      <Menu.Divider />
      <LogOutMenuItem />
    </>
  );
}

export default M0Desktop;
