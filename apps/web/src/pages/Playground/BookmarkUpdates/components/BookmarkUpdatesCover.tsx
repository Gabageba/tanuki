import { Box } from '@mantine/core';
import { VIEW_MODE } from '@tanuki/contracts';
import TitleCardCover from '@/entities/title/card/TitleCard/components/TitleCardCover/TitleCardCover';
import useTitleCardLayout from '@/entities/title/card/TitleCard/hooks/useTitleCardLayout';
import {
  TITLE_CARD_COMPACT_COVER_WIDTH,
  type TitleCardData,
} from '@/entities/title/card/TitleCard/models';
import type { UpdateVariant } from '../models';
import BookmarkUpdatesMarker from './BookmarkUpdatesMarker';

type Props = { data: TitleCardData; variant: UpdateVariant; hasNew: boolean };

function BookmarkUpdatesCover({ data, variant, hasNew }: Props) {
  const { viewMode } = useTitleCardLayout();
  const isGrid = viewMode === VIEW_MODE.GRID;

  return (
    <Box
      pos="relative"
      display="flex"
      flex="none"
      w={isGrid ? '100%' : TITLE_CARD_COMPACT_COVER_WIDTH}
      bdrs="md"
      style={{ overflow: 'hidden' }}
    >
      <TitleCardCover data={data} />
      <BookmarkUpdatesMarker variant={variant} hasNew={hasNew} />
    </Box>
  );
}

export default BookmarkUpdatesCover;
