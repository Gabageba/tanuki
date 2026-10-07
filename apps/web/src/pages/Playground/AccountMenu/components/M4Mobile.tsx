import { Divider, SimpleGrid, Stack } from '@mantine/core';
import PhoneFrame from './PhoneFrame';
import SheetAccountButton from './SheetAccountButton';
import SheetButton from './SheetButton';
import SheetLogOut from './SheetLogOut';
import { getMenuItemIcon, getMenuItemLabel, getVisibleItems } from '../lib';
import { MENU_ITEM, MENU_TRIGGER, SHEET_POSITION, type MockUser } from '../models';

type Props = {
  user: MockUser;
};

const TILES = [
  MENU_ITEM.PROFILE,
  MENU_ITEM.SETTINGS,
  MENU_ITEM.SOURCES_HEALTH,
  MENU_ITEM.MANAGEMENT,
  MENU_ITEM.PLAYGROUND,
];

function M4Mobile({ user }: Props) {
  return (
    <PhoneFrame user={user} trigger={MENU_TRIGGER.MENU} position={SHEET_POSITION.BOTTOM}>
      <Stack gap={4}>
        <SheetAccountButton user={user} />
        <SimpleGrid cols={2} spacing={4}>
          {getVisibleItems(TILES, user).map((item) => (
            <SheetButton key={item} leftSection={getMenuItemIcon(item)}>
              {getMenuItemLabel(item)}
            </SheetButton>
          ))}
        </SimpleGrid>
        <Divider my={4} />
        <SheetLogOut />
      </Stack>
    </PhoneFrame>
  );
}

export default M4Mobile;
