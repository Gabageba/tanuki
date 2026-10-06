import { Fragment } from 'react';
import { Menu } from '@mantine/core';
import { getMenuItemIcon, getMenuItemLabel } from '../lib';
import type { MenuItem } from '../models';

type Props = {
  groups: MenuItem[][];
};

/** Группы пунктов выпадающего меню, между группами — Menu.Divider. */
function MenuGroups({ groups }: Props) {
  return groups.map((group, index) => (
    <Fragment key={group.join()}>
      {index > 0 && <Menu.Divider />}
      {group.map((item) => (
        <Menu.Item key={item} leftSection={getMenuItemIcon(item)}>
          {getMenuItemLabel(item)}
        </Menu.Item>
      ))}
    </Fragment>
  ));
}

export default MenuGroups;
