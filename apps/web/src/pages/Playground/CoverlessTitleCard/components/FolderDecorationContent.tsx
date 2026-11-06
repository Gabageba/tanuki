import { Badge, Box } from '@mantine/core';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import TitleBookmarkMarker from '@/entities/title/markers/TitleBookmarkMarker';
import { TITLE_TAG_HEIGHT } from '@/entities/title/markers/models';
import { FOLDER_MARK_APPEARANCE, type FolderMarkAppearance } from '../models';

type Props = { folder: ResolvedBookmarkFolder; appearance: FolderMarkAppearance };

function FolderDecorationContent({ folder, appearance }: Props) {
  switch (appearance) {
    case FOLDER_MARK_APPEARANCE.SQUARE:
      // У общей метки отступы 4 px от обложки; обёртка сохраняет сам квадрат ровно 22 × 22.
      return (
        <Box pos="relative" w={22} h={22} flex="none">
          <Box pos="absolute" inset={-4}>
            <TitleBookmarkMarker folder={folder} compact />
          </Box>
        </Box>
      );
    case FOLDER_MARK_APPEARANCE.TAG:
      return (
        <Badge
          variant="muted"
          color={folder.color}
          w={TITLE_TAG_HEIGHT}
          h={TITLE_TAG_HEIGHT}
          p={0}
          radius="sm"
          role="img"
          aria-label={folder.name}
        >
          <FolderGlyph folder={folder} size={13} weight="fill" />
        </Badge>
      );
  }
}

export default FolderDecorationContent;
