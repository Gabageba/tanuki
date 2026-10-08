import { Center } from '@mantine/core';
import type { IconWeight } from '@phosphor-icons/react';
import { getBookmarkFolderTextColor, renderBookmarkFolderIcon } from './lib';
import type { ResolvedBookmarkFolder } from './models';

type Props = {
  folder: Pick<ResolvedBookmarkFolder, 'icon' | 'color'>;
  size?: number;
  weight?: IconWeight;
  /** Своим цветом, а не цветом папки — например белым на подложке. */
  color?: string;
};

/** Иконка папки в её цвете. */
function FolderGlyph({ folder, size = 16, weight = 'regular', color }: Props) {
  return (
    <Center c={color ?? getBookmarkFolderTextColor(folder.color)} flex="none">
      {renderBookmarkFolderIcon(folder.icon, { size, weight })}
    </Center>
  );
}

export default FolderGlyph;
