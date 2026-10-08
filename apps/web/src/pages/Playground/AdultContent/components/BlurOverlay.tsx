import { Badge, Center, Stack, Text } from '@mantine/core';
import { EyeSlashIcon } from '@phosphor-icons/react';
import { BLUR_STYLE, type BlurStyle } from '../models';

type Props = {
  blurStyle: BlurStyle;
  compact?: boolean;
};

/** Что лежит поверх размытой обложки. Белый и затемнение — поверх картинки, тема не важна. */
function BlurOverlay({ blurStyle, compact = false }: Props) {
  switch (blurStyle) {
    case BLUR_STYLE.PLAIN:
      return null;
    case BLUR_STYLE.ICON:
      return (
        <Center pos="absolute" inset={0} c="white">
          <EyeSlashIcon size={compact ? 14 : 40} />
        </Center>
      );
    case BLUR_STYLE.BADGE:
      return (
        <Center pos="absolute" inset={0}>
          <Badge
            size={compact ? 'xs' : 'xl'}
            variant="white"
            c="dark"
            ff="monospace"
            fw={700}
            px={compact ? 4 : undefined}
          >
            18+
          </Badge>
        </Center>
      );
    case BLUR_STYLE.DIMMED:
      return (
        <Center pos="absolute" inset={0} bg="rgba(0, 0, 0, 0.45)" c="white" p="xs">
          {compact ? (
            <Text ff="monospace" fw={700} fz="xs">
              18+
            </Text>
          ) : (
            <Stack gap={4} align="center">
              <Text ff="monospace" fw={700} fz={28} lh={1}>
                18+
              </Text>
              <Text fz={12} ta="center" lh={1.2}>
                Скрыто настройками
              </Text>
            </Stack>
          )}
        </Center>
      );
  }
}

export default BlurOverlay;
