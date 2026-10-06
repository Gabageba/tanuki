import { Divider, Stack, Text } from '@mantine/core';
import PhoneFrame from './PhoneFrame';
import UserAvatar from './UserAvatar';
import SheetButton from './SheetButton';
import SheetGroups from './SheetGroups';
import SheetLogOut from './SheetLogOut';
import { getVisibleGroups } from '../lib';
import { MENU_ITEM, MENU_TRIGGER, SHEET_POSITION, type MockUser } from '../models';

type Props = {
  user: MockUser;
};

function M3Mobile({ user }: Props) {
  return (
    <PhoneFrame user={user} trigger={MENU_TRIGGER.AVATAR_NAME} position={SHEET_POSITION.BOTTOM}>
      <Stack gap={4}>
        <SheetButton leftSection={<UserAvatar user={user} size={22} />}>
          <Text inherit fw={500} truncate>
            {user.username}
          </Text>
        </SheetButton>
        <SheetGroups groups={[[MENU_ITEM.SETTINGS]]} />
        <Divider my={4} />
        <SheetGroups
          groups={getVisibleGroups(
            [[MENU_ITEM.SOURCES_HEALTH, MENU_ITEM.MANAGEMENT, MENU_ITEM.PLAYGROUND]],
            user,
          )}
        />
        <Divider my={4} />
        <SheetLogOut />
      </Stack>
    </PhoneFrame>
  );
}

export default M3Mobile;
