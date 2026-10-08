import { Card, Stack } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { BOOKMARK_AVAILABILITY, type BookmarkItem } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import BookmarkCover from './BookmarkCover';
import BookmarkMetaLine from './BookmarkMetaLine';
import BookmarkTitle from './BookmarkTitle';
import titleStyles from '@/entities/title/Title.module.scss';

type Props = {
  bookmark: BookmarkItem;
};

/** Закладка плиткой — раскладка как у `TitleGridCard`: обложка, мета-строка, название. */
function BookmarkGridCard({ bookmark }: Props) {
  const isUnavailable = bookmark.availability !== BOOKMARK_AVAILABILITY.AVAILABLE;

  return (
    <Card
      component={Link}
      to={generatePath(ROUTE_PATHS.TITLE, { titleId: bookmark.titleId })}
      data-view-mode="grid"
      className={titleStyles.card}
    >
      <Stack gap={8}>
        <BookmarkCover bookmark={bookmark} />
        <Stack gap={4}>
          <BookmarkMetaLine bookmark={bookmark} />
          <BookmarkTitle
            name={bookmark.name}
            hasNew={!isUnavailable && bookmark.newChaptersCount > 0}
            isDimmed={isUnavailable}
          />
        </Stack>
      </Stack>
    </Card>
  );
}

export default BookmarkGridCard;
