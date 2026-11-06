import TitleCardName from '@/entities/title/card/TitleCard/components/TitleCardName/TitleCardName';
import type { TitleCardData } from '@/entities/title/card/TitleCard/models';
import { UPDATE_VARIANT, type UpdateVariant } from '../models';
import BookmarkUpdatesDotName from './BookmarkUpdatesDotName/BookmarkUpdatesDotName';
import BookmarkUpdatesLineName from './BookmarkUpdatesLineName';

type Props = { data: TitleCardData; variant: UpdateVariant; hasNew: boolean };

function BookmarkUpdatesName({ data, variant, hasNew }: Props) {
  switch (variant) {
    case UPDATE_VARIANT.TITLE_LINE:
      return <BookmarkUpdatesLineName data={data} hasNew={hasNew} />;
    case UPDATE_VARIANT.SHORT_TITLE_LINE:
      return <BookmarkUpdatesLineName data={data} hasNew={hasNew} short />;
    case UPDATE_VARIANT.LAST_LINE_DOT:
    case UPDATE_VARIANT.TOP_RIGHT_DOT:
    case UPDATE_VARIANT.CENTER_RIGHT_DOT:
      return <BookmarkUpdatesDotName data={data} variant={variant} hasNew={hasNew} />;
    case UPDATE_VARIANT.CURRENT:
    case UPDATE_VARIANT.PROGRESS_DOT:
    case UPDATE_VARIANT.COVER_DOT:
    case UPDATE_VARIANT.COVER_LABEL:
    case UPDATE_VARIANT.CARD_STRIPE:
    case UPDATE_VARIANT.CARD_TINT:
    case UPDATE_VARIANT.STATUS_ROW:
    case UPDATE_VARIANT.QUIET_PROGRESS:
    case UPDATE_VARIANT.QUIET_ICON:
    case UPDATE_VARIANT.QUIET_WORD:
    case UPDATE_VARIANT.ACTIONS_DOT:
    case UPDATE_VARIANT.ACCENT_ICON:
    case UPDATE_VARIANT.ACCENT_STROKE:
    case UPDATE_VARIANT.ORANGE_META:
      return <TitleCardName data={data} />;
  }
}

export default BookmarkUpdatesName;
