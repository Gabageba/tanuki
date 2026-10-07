import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import {
  AVAILABILITY,
  CARD_VARIANT,
  UNAVAILABLE_VARIANT,
  type CardVariant,
  type MockBookmark,
  type UnavailableVariant,
} from '../models';
import { isTitleDimmed } from '../lib';
import BookmarkCover from './BookmarkCover';
import BookmarkMetaLine from './BookmarkMetaLine';
import BookmarkTitle from './BookmarkTitle';
import titleStyles from '@/entities/title/Title.module.scss';

type Props = {
  bookmark: MockBookmark;
  variant: CardVariant;
  unavailableVariant?: UnavailableVariant;
};

/** Карточка закладки списком — раскладка как у `TitleListCard`, но без описания и тегов: в
 *  закладках важнее, где остановился, чем о чём тайтл. */
function BookmarkListCard({
  bookmark,
  variant,
  unavailableVariant = UNAVAILABLE_VARIANT.DIMMED,
}: Props) {
  const isUnavailable = bookmark.availability !== AVAILABILITY.AVAILABLE;
  const isDimmed = isUnavailable && isTitleDimmed(unavailableVariant);

  return (
    <Card component="a" href="#" data-view-mode="list" className={titleStyles.card} withBorder>
      <Group align="start" gap={0} wrap="nowrap">
        <BookmarkCover
          bookmark={bookmark}
          variant={variant}
          unavailableVariant={unavailableVariant}
          compact
          w={84}
        />
        <Stack p="sm" flex={1} miw={0} gap={8}>
          <Group gap={8} wrap="nowrap">
            {bookmark.isAdult && (
              <Badge color="red" ff="monospace" flex="none">
                18+
              </Badge>
            )}
            <BookmarkMetaLine
              bookmark={bookmark}
              variant={variant}
              unavailableVariant={unavailableVariant}
            />
          </Group>
          <BookmarkTitle
            bookmark={bookmark}
            variant={variant}
            isDimmed={isDimmed}
            fz={{ base: 15, xs: 17 }}
          />
          {variant !== CARD_VARIANT.CATALOG && variant !== CARD_VARIANT.COVER_PROGRESS && (
            <Text fz={12} c="dimmed" lh="tight">
              {bookmark.typeLabel}
            </Text>
          )}
        </Stack>
      </Group>
    </Card>
  );
}

export default BookmarkListCard;
