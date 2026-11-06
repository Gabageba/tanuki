import { Center } from '@mantine/core';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';

type Props = { folder?: ResolvedBookmarkFolder | null };

/** Сохранённая иконка отклонённых вариантов M0 и M1. */
function MarkerInlineIcon({ folder }: Props) {
  if (!folder) return null;

  return (
    <Center
      w={16}
      h="1lh"
      lh="tight"
      flex="none"
      title={folder.name}
      role="img"
      aria-label={folder.name}
    >
      <FolderGlyph folder={folder} size={16} weight="fill" />
    </Center>
  );
}

export default MarkerInlineIcon;
