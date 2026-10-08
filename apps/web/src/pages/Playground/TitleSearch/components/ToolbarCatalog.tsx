import type { ReactNode } from 'react';
import { Grid } from '@mantine/core';

type Props = {
  filtersButton: ReactNode;
  viewSwitch: ReactNode;
  pills: ReactNode;
  isPhone: boolean;
};

/** G3 / телефон как в каталоге — сетка `CatalogSettings`: на десктопе вид у правого края, на
 *  телефоне всё столбиком, вид последним. */
function ToolbarCatalog({ filtersButton, viewSwitch, pills, isPhone }: Props) {
  return (
    <Grid gap="sm">
      <Grid.Col span={isPhone ? 12 : 'auto'}>{filtersButton}</Grid.Col>
      <Grid.Col span={isPhone ? 12 : 'content'} order={isPhone ? 3 : 2}>
        {viewSwitch}
      </Grid.Col>
      <Grid.Col span={12} order={isPhone ? 2 : 3}>
        {pills}
      </Grid.Col>
    </Grid>
  );
}

export default ToolbarCatalog;
