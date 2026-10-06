import { Divider, Stack, Text } from '@mantine/core';
import PhoneFrame from './PhoneFrame';
import SheetGroups from './SheetGroups';
import SheetLogOut from './SheetLogOut';
import { getVisibleGroups } from '../lib';
import { MENU_ITEM, MENU_TRIGGER, SHEET_POSITION, type MockUser } from '../models';

type Props = {
  user: MockUser;
};

function M0Mobile({ user }: Props) {
  const groups = getVisibleGroups(
    [[MENU_ITEM.SETTINGS], [MENU_ITEM.MANAGEMENT], [MENU_ITEM.PLAYGROUND]],
    user,
  );

  return (
    <PhoneFrame
      user={user}
      trigger={MENU_TRIGGER.MENU}
      position={SHEET_POSITION.RIGHT}
      title="Меню"
    >
      <Stack gap={4}>
        <Text size="sm" c="dimmed" px="sm" py={4}>
          {user.username}
        </Text>
        <SheetGroups groups={groups} />
        <Divider my={4} />
        <SheetLogOut />
      </Stack>
    </PhoneFrame>
  );
}

export default M0Mobile;
