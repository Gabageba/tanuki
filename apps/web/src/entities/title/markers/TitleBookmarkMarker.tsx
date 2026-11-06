import { Center } from '@mantine/core';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import { COVER_BADGE_COLOR } from './models';

type Props = {
  folder?: ResolvedBookmarkFolder | null;
  compact?: boolean;
};

/**
 * Метка папки на тёмной подложке в левом нижнем углу обложки (K4a).
 */
function TitleBookmarkMarker({ folder, compact = false }: Props) {
  if (!folder) return null;

  const size = compact ? 22 : 26;

  return (
    <Center
      pos="absolute"
      bottom={compact ? 4 : 6}
      left={compact ? 4 : 6}
      w={size}
      h={size}
      bdrs="md"
      bg={COVER_BADGE_COLOR}
      style={{ zIndex: 1 }}
      title={folder.name}
      role="img"
      aria-label={folder.name}
    >
      <FolderGlyph
        folder={folder}
        color={`var(--mantine-color-${folder.color}-4)`}
        size={compact ? 13 : 15}
        weight="fill"
      />
    </Center>
  );
}

export default TitleBookmarkMarker;
