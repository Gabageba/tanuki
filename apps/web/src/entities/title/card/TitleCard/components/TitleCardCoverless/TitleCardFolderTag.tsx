import { Link, type To } from 'react-router';
import { Badge, Center, Tooltip } from '@mantine/core';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import { TITLE_TAG_HEIGHT } from '@/entities/title/markers/models';

type Props = { folder?: ResolvedBookmarkFolder | null; to: To; id: string };

function TitleCardFolderTag({ folder, to, id }: Props) {
  if (!folder) return null;
  return (
    <Tooltip label={folder.name} withArrow>
      <Center
        component={Link}
        to={to}
        tabIndex={-1}
        pos="relative"
        w={TITLE_TAG_HEIGHT}
        h="1lh"
        lh="tight"
        flex="none"
      >
        <Badge
          variant="muted"
          color={folder.color}
          w={TITLE_TAG_HEIGHT}
          h={TITLE_TAG_HEIGHT}
          p={0}
          radius="sm"
          id={id}
          role="img"
          aria-label={folder.name}
        >
          <FolderGlyph folder={folder} size={13} weight="fill" />
        </Badge>
      </Center>
    </Tooltip>
  );
}

export default TitleCardFolderTag;
