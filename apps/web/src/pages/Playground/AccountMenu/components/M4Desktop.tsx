import { Button, Menu, SimpleGrid } from '@mantine/core';
import MenuAccountItem from './MenuAccountItem';
import MenuGroups from './MenuGroups';
import LogOutMenuItem from './LogOutMenuItem';
import { getMenuItemIcon, getMenuItemLabel, getVisibleGroups } from '../lib';
import { MENU_ITEM, type MockUser } from '../models';

type Props = {
  user: MockUser;
};

const TILES = [MENU_ITEM.PROFILE, MENU_ITEM.SETTINGS];

function M4Desktop({ user }: Props) {
  return (
    <>
      <MenuAccountItem user={user} />
      <SimpleGrid cols={2} spacing={4} p={4}>
        {TILES.map((item) => (
          <Button
            key={item}
            variant="tile"
            size="sm"
            justify="flex-start"
            leftSection={getMenuItemIcon(item)}
          >
            {getMenuItemLabel(item)}
          </Button>
        ))}
      </SimpleGrid>
      <Menu.Divider />
      <MenuGroups
        groups={getVisibleGroups(
          [[MENU_ITEM.SOURCES_HEALTH, MENU_ITEM.MANAGEMENT, MENU_ITEM.PLAYGROUND]],
          user,
        )}
      />
      <Menu.Divider />
      <LogOutMenuItem />
    </>
  );
}

export default M4Desktop;
