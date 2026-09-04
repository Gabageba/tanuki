import { Box, Group, Text } from '@mantine/core';
import type { MangaState as MangaStateType } from '@tanuki/contracts';
import { getMangaStateColor, getMangaStateLabel } from './lib';

type Props = {
  state: MangaStateType;
};

function MangaState({ state }: Props) {
  const color = getMangaStateColor(state);

  return (
    <Group gap={6} align="center" wrap="nowrap">
      <Box bg={color} bdrs="50%" w={6} h={6} flex="none" mt={2} />
      <Text c={color} fz={12} lh={1} visibleFrom="xxs">
        {getMangaStateLabel(state)}
      </Text>
    </Group>
  );
}

export default MangaState;
