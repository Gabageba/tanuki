import { Center } from '@mantine/core';
import type { ResolvedFolder } from '../models';
import FolderGlyph from './FolderGlyph';

type Props = {
  folder: Pick<ResolvedFolder, 'icon' | 'color'>;
  isSelected: boolean;
  /** Сторона плашки; иконка без плашки занимает столько же — названия стоят колонкой. */
  size?: number;
  iconSize?: number;
};

/** Иконка папки в списке выбора: у выбранной — белая в залитой плашке её цвета, как метка K2 на
 *  карточке тайтла; у остальных — просто контурная иконка цвета папки. */
function FolderChoiceIcon({ folder, isSelected, size = 22, iconSize = 14 }: Props) {
  return (
    <Center
      w={size}
      h={size}
      flex="none"
      bdrs="sm"
      bg={isSelected ? `var(--mantine-color-${folder.color}-filled)` : undefined}
    >
      <FolderGlyph folder={folder} size={iconSize} color={isSelected ? 'white' : undefined} />
    </Center>
  );
}

export default FolderChoiceIcon;
