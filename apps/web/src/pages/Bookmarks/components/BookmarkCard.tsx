import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BOOKMARK_AVAILABILITY, type BookmarkItem } from '@tanuki/contracts';
import { getLabelByTitleType } from '@/entities/source/lib';
import TitleGridCard from '@/entities/title/card/TitleGridCard';
import TitleListCard from '@/entities/title/card/TitleListCard';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';
import BookmarkCover from './BookmarkCover';
import BookmarkMetaLine from './BookmarkMetaLine';
import BookmarkTitle from './BookmarkTitle';

type Props = {
  bookmark: BookmarkItem;
  viewMode: ViewMode;
};

/** Карточка закладки (C10h) в виде, выбранном для каталога. Ведёт на источник свежей отметки
 *  чтения — его выбрал сервер. Раскладка та же, что у тайтла; в списке без описания и тегов:
 *  в закладках важнее, где остановился, чем о чём тайтл. */
function BookmarkCard({ bookmark, viewMode }: Props) {
  const { t } = useTranslation();
  const isUnavailable = bookmark.availability !== BOOKMARK_AVAILABILITY.AVAILABLE;
  const hasNew = !isUnavailable && bookmark.newChaptersCount > 0;

  switch (viewMode) {
    case VIEW_MODE.GRID:
      return (
        <TitleGridCard
          titleId={bookmark.titleId}
          cover={<BookmarkCover bookmark={bookmark} />}
          meta={<BookmarkMetaLine bookmark={bookmark} />}
          name={<BookmarkTitle name={bookmark.name} hasNew={hasNew} isDimmed={isUnavailable} />}
        />
      );
    case VIEW_MODE.LIST: {
      const typeLabel = getLabelByTitleType(bookmark.type, t);
      return (
        <TitleListCard
          titleId={bookmark.titleId}
          contentRating={bookmark.contentRating}
          cover={<BookmarkCover bookmark={bookmark} compact w={84} />}
          meta={<BookmarkMetaLine bookmark={bookmark} />}
          name={
            <BookmarkTitle name={bookmark.name} hasNew={hasNew} isDimmed={isUnavailable} fz="sm" />
          }
          footer={
            typeLabel && (
              <Text fz={12} c="dimmed" lh="tight">
                {typeLabel}
              </Text>
            )
          }
        />
      );
    }
  }
}

export default BookmarkCard;
