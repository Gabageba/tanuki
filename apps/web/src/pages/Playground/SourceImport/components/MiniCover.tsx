import { Box } from '@mantine/core';
import type { BookmarkFolderColor } from '@tanuki/contracts';
import { getMutedBorderColor } from '@/shared/lib/palette';

type Props = {
  hue: BookmarkFolderColor;
};

/** Заглушка обложки в R3 — в приложении здесь `CoverImage` из снимка сайта. */
function MiniCover({ hue }: Props) {
  return (
    <Box
      w={30}
      h={42}
      flex="none"
      bg={`var(--mantine-color-${hue}-light)`}
      bd={`1px solid ${getMutedBorderColor(hue)}`}
      style={{ borderRadius: 'var(--mantine-radius-sm)' }}
    />
  );
}

export default MiniCover;
