import { Box } from '@mantine/core';
import { SignOutIcon } from '@phosphor-icons/react';
import SheetRow from './SheetRow';
import SheetLabel from './SheetLabel';
import SheetDivider from './SheetDivider';
import { getMenuItemIcon, getMenuItemLabel, getVisibleSections } from '../lib';
import { M2_SECTIONS } from '../mocks';
import type { MockUser } from '../models';

type Props = {
  user: MockUser;
  isLarge?: boolean;
};

/** Разделы M2 строками в размер Menu.Item — тело мобильного меню M5. */
function M5Sections({ user, isLarge = false }: Props) {
  return (
    <>
      {getVisibleSections(M2_SECTIONS, user).map((section, index) => (
        <Box key={section.label}>
          {index > 0 && <SheetDivider />}
          <SheetLabel>{section.label}</SheetLabel>
          {section.items.map((item) => (
            <SheetRow key={item} isLarge={isLarge} leftSection={getMenuItemIcon(item)}>
              {getMenuItemLabel(item)}
            </SheetRow>
          ))}
        </Box>
      ))}
      <SheetDivider />
      <SheetRow isDanger isLarge={isLarge} leftSection={<SignOutIcon />}>
        Выйти
      </SheetRow>
    </>
  );
}

export default M5Sections;
