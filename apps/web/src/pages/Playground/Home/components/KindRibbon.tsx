import { useContext } from 'react';
import { Box, Group, Scroller, Stack, Text } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import TitleCard from '@/entities/title/card/TitleCard';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';

type Props = {
  title: string;
  items: Title[];
};

/** P5 — общая лента вида блока со всех источников: на обложке — лента источника, иначе не понять,
 *  откуда тайтл. */
function KindRibbon({ title, items }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);

  if (items.length === 0) {
    return null;
  }

  return (
    <Stack gap="xs">
      <Text fz="sm" fw={600} lh="tight">
        {title}
      </Text>
      <Scroller>
        <Group gap="md" wrap="nowrap" align="flex-start">
          {items.map((item) => (
            <Box key={item.id} w={isPhone ? 128 : 168} flex="none">
              <TitleCard title={item} showSource />
            </Box>
          ))}
        </Group>
      </Scroller>
    </Stack>
  );
}

export default KindRibbon;
