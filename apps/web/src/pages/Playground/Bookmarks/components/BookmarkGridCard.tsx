import { Card, Stack } from '@mantine/core';
import {
  AVAILABILITY,
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

/** Карточка закладки в сетке — раскладка как у `TitleGridCard`: обложка, мета-строка, название. */
function BookmarkGridCard({
  bookmark,
  variant,
  unavailableVariant = UNAVAILABLE_VARIANT.DIMMED,
}: Props) {
  const isUnavailable = bookmark.availability !== AVAILABILITY.AVAILABLE;
  const isDimmed = isUnavailable && isTitleDimmed(unavailableVariant);

  return (
    <Card component="a" href="#" data-view-mode="grid" className={titleStyles.card}>
      <Stack gap={8}>
        <BookmarkCover
          bookmark={bookmark}
          variant={variant}
          unavailableVariant={unavailableVariant}
        />
        <Stack gap={4}>
          <BookmarkMetaLine
            bookmark={bookmark}
            variant={variant}
            unavailableVariant={unavailableVariant}
          />
          <BookmarkTitle bookmark={bookmark} variant={variant} isDimmed={isDimmed} />
        </Stack>
      </Stack>
    </Card>
  );
}

export default BookmarkGridCard;
