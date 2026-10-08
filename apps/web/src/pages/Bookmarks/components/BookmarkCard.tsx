import type { BookmarkItem } from '@tanuki/contracts';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';
import BookmarkGridCard from './BookmarkGridCard';
import BookmarkListCard from './BookmarkListCard';

type Props = {
  bookmark: BookmarkItem;
  viewMode: ViewMode;
};

/** Карточка закладки (C10h) в виде, выбранном для каталога. Ведёт на источник свежей отметки
 *  чтения — его выбрал сервер. */
function BookmarkCard({ bookmark, viewMode }: Props) {
  switch (viewMode) {
    case VIEW_MODE.GRID:
      return <BookmarkGridCard bookmark={bookmark} />;
    case VIEW_MODE.LIST:
      return <BookmarkListCard bookmark={bookmark} />;
  }
}

export default BookmarkCard;
