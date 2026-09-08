import type { MantineStyleProps } from '@mantine/core';
import { Box, Group, Text } from '@mantine/core';
import type { MangaState as MangaStateType } from '@tanuki/contracts';
import { getMangaStateColor, getMangaStateLabel } from './card/lib';

type Props = {
  state: MangaStateType;
  fz?: number;
  dotMt?: MantineStyleProps['mt'];
  coloredText?: boolean;
  fw?: MantineStyleProps['fw'];
};

function MangaState({ state, fz = 12, dotMt = 2, coloredText = false, fw = 400 }: Props) {
  const color = getMangaStateColor(state);

  return (
    <Group gap={6} align="center" wrap="nowrap">
      <Box bg={color} bdrs="50%" w={fz / 2} h={fz / 2} flex="none" mt={dotMt} />
      <Text c={coloredText ? color : undefined} fz={fz} fw={fw} lh={1} visibleFrom="xxs">
        {getMangaStateLabel(state)}
      </Text>
    </Group>
  );
}

export default MangaState;
