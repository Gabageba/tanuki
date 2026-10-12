import { useContext, type ReactNode } from 'react';
import { Flex, SimpleGrid, Stack } from '@mantine/core';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { SETTINGS_BLOCKS, type SettingsBlocks } from '../models';

type Props = {
  layout: SettingsBlocks;
  children: ReactNode;
};

/** Галочки блоков под строкой источника: строкой с переносом (T1), колонкой (T1a) или сеткой
 *  2/3 (T1b). */
function SettingsBlockList({ layout, children }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);

  switch (layout) {
    case SETTINGS_BLOCKS.WRAP:
      return (
        <Flex wrap="wrap" columnGap="md" rowGap={8}>
          {children}
        </Flex>
      );
    case SETTINGS_BLOCKS.COLUMN:
      return <Stack gap={8}>{children}</Stack>;
    case SETTINGS_BLOCKS.GRID:
      return (
        <SimpleGrid cols={isPhone ? 2 : 3} spacing="md" verticalSpacing={8}>
          {children}
        </SimpleGrid>
      );
  }
}

export default SettingsBlockList;
