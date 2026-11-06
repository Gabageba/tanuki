import { Badge } from '@mantine/core';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';

type Props = { folder?: ResolvedBookmarkFolder | null };

function MarkerFolderPill({ folder }: Props) {
  if (!folder) return null;

  return (
    <Badge
      variant="muted"
      color={folder.color}
      leftSection={<FolderGlyph folder={folder} size={12} weight="fill" />}
      size="lg"
      radius="sm"
      tt="none"
      fw={500}
      miw={0}
      maw={150}
      style={{ flexShrink: 1 }}
      title={folder.name}
    >
      {folder.name}
    </Badge>
  );
}

export default MarkerFolderPill;
