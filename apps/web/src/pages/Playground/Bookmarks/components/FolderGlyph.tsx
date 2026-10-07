import { Center } from '@mantine/core';
import type { IconWeight } from '@phosphor-icons/react';
import { getFolderTextColor, renderFolderIcon } from '../lib';
import type { ResolvedFolder } from '../models';

type Props = {
  folder: Pick<ResolvedFolder, 'icon' | 'color'>;
  size?: number;
  weight?: IconWeight;
  /** Своим цветом, а не цветом папки — например белым на подложке. */
  color?: string;
};

/** Иконка папки в её цвете. */
function FolderGlyph({ folder, size = 16, weight = 'regular', color }: Props) {
  return (
    <Center c={color ?? getFolderTextColor(folder.color)} flex="none">
      {renderFolderIcon(folder.icon, { size, weight })}
    </Center>
  );
}

export default FolderGlyph;
