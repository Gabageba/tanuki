import { Badge, Box, Tooltip } from '@mantine/core';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';

type Props = { folder: ResolvedBookmarkFolder | null; withName: boolean };

function CoverlessFolderMark({ folder, withName }: Props) {
  if (!folder) return null;

  return (
    <Tooltip label={folder.name} withArrow>
      <Box pos="relative" miw={0} maw="45%" flex="none" title={folder.name}>
        {withName ? (
          <Badge
            variant="muted"
            color={folder.color}
            leftSection={<FolderGlyph folder={folder} size={12} weight="fill" />}
            size="lg"
            radius="sm"
            tt="none"
            fw={500}
            maw="100%"
          >
            {folder.name}
          </Badge>
        ) : (
          <FolderGlyph folder={folder} size={16} weight="fill" />
        )}
      </Box>
    </Tooltip>
  );
}

export default CoverlessFolderMark;
