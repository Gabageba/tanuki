import { Box, Menu } from '@mantine/core';
import { SignOutIcon } from '@phosphor-icons/react';
import AccountCard from './AccountCard';
import { getMenuItemIcon, getMenuItemLabel, getVisibleSections } from '../lib';
import { M2_SECTIONS } from '../mocks';
import type { MockUser } from '../models';

type Props = {
  user: MockUser;
  isLarge?: boolean;
};

/** M2 с полями, выровненными под мобильное: карточка с тем же отступом 12px, что у пунктов. */
function M5Desktop({ user, isLarge = false }: Props) {
  const py = isLarge ? 10 : undefined;

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
            <Menu.Item key={item} py={py} leftSection={getMenuItemIcon(item)}>
              {getMenuItemLabel(item)}
            </Menu.Item>
          ))}
        </Box>
      ))}
      <Menu.Divider />
      <Menu.Item py={py} color="red" leftSection={<SignOutIcon />}>
        Выйти
      </Menu.Item>
    </>
  );
}

export default M5Desktop;
