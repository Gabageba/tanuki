import { Divider, Stack, Text } from '@mantine/core';
import PhoneFrame from './PhoneFrame';
import AccountCard from './AccountCard';
import SheetButton from './SheetButton';
import SheetLogOut from './SheetLogOut';
import { getMenuItemIcon, getMenuItemLabel, getVisibleSections } from '../lib';
import { M2_SECTIONS } from '../mocks';
import { MENU_TRIGGER, SHEET_POSITION, type MockUser } from '../models';

type Props = {
  user: MockUser;
};

function M2Mobile({ user }: Props) {
  return (
    <PhoneFrame
      user={user}
      trigger={MENU_TRIGGER.AVATAR_PROFILE}
      position={SHEET_POSITION.RIGHT}
      title={<AccountCard user={user} withRole />}
    >
      <Stack gap="md">
        {getVisibleSections(M2_SECTIONS, user).map((section) => (
          <Stack key={section.label} gap={4}>
            <Text fz="xs" fw={500} c="dimmed" px="sm">
              {section.label}
            </Text>
            {section.items.map((item) => (
              <SheetButton key={item} leftSection={getMenuItemIcon(item)}>
                {getMenuItemLabel(item)}
              </SheetButton>
            ))}
          </Stack>
        ))}
        <Stack gap={4}>
          <Divider />
          <SheetLogOut />
        </Stack>
      </Stack>
    </PhoneFrame>
  );
}

export default M2Mobile;
