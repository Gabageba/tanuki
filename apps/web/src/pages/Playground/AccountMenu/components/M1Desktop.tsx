import { Menu } from '@mantine/core';
import MenuAccountItem from './MenuAccountItem';
import MenuGroups from './MenuGroups';
import LogOutMenuItem from './LogOutMenuItem';
import { getVisibleGroups } from '../lib';
import { PERSONAL_GROUP, STAFF_GROUP } from '../mocks';
import type { MockUser } from '../models';

type Props = {
  user: MockUser;
};

function M1Desktop({ user }: Props) {
  return (
    <>
      <MenuAccountItem user={user} />
      <Menu.Divider />
      <MenuGroups groups={getVisibleGroups([PERSONAL_GROUP, STAFF_GROUP], user)} />
      <Menu.Divider />
      <LogOutMenuItem />
    </>
  );
}

export default M1Desktop;
