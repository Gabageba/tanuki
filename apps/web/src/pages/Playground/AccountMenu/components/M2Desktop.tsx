import { Box, Menu } from '@mantine/core';
import AccountCard from './AccountCard';
import LogOutMenuItem from './LogOutMenuItem';
import { getMenuItemIcon, getMenuItemLabel, getVisibleSections } from '../lib';
import { M2_SECTIONS } from '../mocks';
import type { MockUser } from '../models';

type Props = {
  user: MockUser;
};

function M2Desktop({ user }: Props) {
  return (
    <>
      <Box px="sm" py="xs">
        <AccountCard user={user} withRole />
      </Box>
      {getVisibleSections(M2_SECTIONS, user).map((section) => (
        <Box key={section.label}>
          <Menu.Divider />
          <Menu.Label>{section.label}</Menu.Label>
          {section.items.map((item) => (
            <Menu.Item key={item} leftSection={getMenuItemIcon(item)}>
              {getMenuItemLabel(item)}
            </Menu.Item>
          ))}
        </Box>
      ))}
      <Menu.Divider />
      <LogOutMenuItem />
    </>
  );
}

export default M2Desktop;
