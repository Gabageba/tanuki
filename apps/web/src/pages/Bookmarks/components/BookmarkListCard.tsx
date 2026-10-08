import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BOOKMARK_AVAILABILITY, CONTENT_RATING, type BookmarkItem } from '@tanuki/contracts';
import { getLabelByTitleType } from '@/entities/source/lib';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import BookmarkCover from './BookmarkCover';
import BookmarkMetaLine from './BookmarkMetaLine';
import BookmarkTitle from './BookmarkTitle';
import titleStyles from '@/entities/title/Title.module.scss';

type Props = {
  bookmark: BookmarkItem;
};

/** Закладка списком — раскладка как у `TitleListCard`, но без описания и тегов: в закладках
 *  важнее, где остановился, чем о чём тайтл. */
function BookmarkListCard({ bookmark }: Props) {
  const { t } = useTranslation();
  const isUnavailable = bookmark.availability !== BOOKMARK_AVAILABILITY.AVAILABLE;
  const typeLabel = getLabelByTitleType(bookmark.type, t);

  return (
    <Card
      component={Link}
      to={generatePath(ROUTE_PATHS.TITLE, { titleId: bookmark.titleId })}
      data-view-mode="list"
      className={titleStyles.card}
      withBorder
    >
      <Group align="start" gap={0} wrap="nowrap">
        <BookmarkCover bookmark={bookmark} compact w={84} />
        <Stack p="sm" flex={1} miw={0} gap={8}>
          <Group gap={8} wrap="nowrap">
            {bookmark.contentRating === CONTENT_RATING.ADULT && (
              <Badge variant="muted" color="red" ff="monospace" flex="none">
                18+
              </Badge>
            )}
            <BookmarkMetaLine bookmark={bookmark} />
          </Group>
          <BookmarkTitle
            name={bookmark.name}
            hasNew={!isUnavailable && bookmark.newChaptersCount > 0}
            isDimmed={isUnavailable}
            fz="sm"
          />
          {typeLabel && (
            <Text fz={12} c="dimmed" lh="tight">
              {typeLabel}
            </Text>
          )}
        </Stack>
      </Group>
    </Card>
  );
}

export default BookmarkListCard;
