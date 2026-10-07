import { Divider, Stack } from '@mantine/core';
import PhoneFrame from './PhoneFrame';
import SheetAccountButton from './SheetAccountButton';
import SheetGroups from './SheetGroups';
import SheetLogOut from './SheetLogOut';
import { getVisibleGroups } from '../lib';
import { PERSONAL_GROUP, STAFF_GROUP } from '../mocks';
import { MENU_TRIGGER, SHEET_POSITION, type MockUser } from '../models';

type Props = {
  user: MockUser;
};

function M1Mobile({ user }: Props) {
  return (
    <PhoneFrame user={user} trigger={MENU_TRIGGER.MENU} position={SHEET_POSITION.BOTTOM}>
      <Stack gap={4}>
        <SheetAccountButton user={user} />
        <Divider my={4} />
        <SheetGroups groups={getVisibleGroups([PERSONAL_GROUP, STAFF_GROUP], user)} />
        <Divider my={4} />
        <SheetLogOut />
      </Stack>
    </PhoneFrame>
  );
}

export default M1Mobile;
