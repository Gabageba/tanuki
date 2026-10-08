import { Center } from '@mantine/core';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import { COVER_BADGE_COLOR } from './models';

type Props = {
  folder: ResolvedBookmarkFolder;
  compact?: boolean;
};

/**
 * Метка «в закладках» (K4a): квадрат на тёмной подложке рейтинга с залитой иконкой папки светлым
 * оттенком её цвета, в левом нижнем углу обложки, напротив рейтинга, — в одном углу во всех
 * контекстах. Подложка, а не цвет папки, отделяет метку от обложки — она не сливается с картинкой.
 */
function TitleBookmarkMarker({ folder, compact = false }: Props) {
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
