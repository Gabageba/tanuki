import { Badge } from '@mantine/core';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import type { TargetFolder } from '../models';

type Props = {
  folder: TargetFolder;
};

/** Наша папка, куда ляжет тайтл: бейдж в цвете папки с её иконкой. Не сжимается — длинное название
 *  тайтла переносится, а не выдавливает бейдж. */
function FolderBadge({ folder }: Props) {
  return (
    <Badge
      variant="muted"
      color={folder.color}
      size="sm"
      flex="none"
      maw={180}
      leftSection={<FolderGlyph folder={folder} size={12} />}
    >
      {folder.name}
    </Badge>
  );
}

export default FolderBadge;
