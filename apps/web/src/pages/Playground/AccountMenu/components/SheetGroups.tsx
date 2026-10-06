import { Fragment } from 'react';
import { Divider } from '@mantine/core';
import SheetButton from './SheetButton';
import { getMenuItemIcon, getMenuItemLabel } from '../lib';
import type { MenuItem } from '../models';

type Props = {
  groups: MenuItem[][];
};

/** Группы пунктов мобильного меню: внутри группы зазор 4px, между группами — линия. */
function SheetGroups({ groups }: Props) {
  return groups.map((group, index) => (
    <Fragment key={group.join()}>
      {index > 0 && <Divider my={4} />}
      {group.map((item) => (
        <SheetButton key={item} leftSection={getMenuItemIcon(item)}>
          {getMenuItemLabel(item)}
        </SheetButton>
      ))}
    </Fragment>
  ));
}

export default SheetGroups;
