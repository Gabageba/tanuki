import { Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import {
  UNAVAILABLE_VARIANT,
  type CardVariant,
  type MockBookmark,
  type UnavailableVariant,
} from '../models';
import BookmarkGridCard from './BookmarkGridCard';
import BookmarkListCard from './BookmarkListCard';
import PhoneFrame from './PhoneFrame';

type Props = {
  bookmarks: MockBookmark[];
  variant: CardVariant;
  unavailableVariant?: UnavailableVariant;
};

/** Одни и те же закладки сеткой и списком на десктопе и в рамке телефона. */
function CardsDemo({ bookmarks, variant, unavailableVariant = UNAVAILABLE_VARIANT.DIMMED }: Props) {
  const [first] = bookmarks;

  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="md">
        <Stack gap="md">
          <Text fz={12} c="dimmed" ff="monospace">
            Сетка
          </Text>
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="md" maw={960}>
            {bookmarks.map((bookmark) => (
              <BookmarkGridCard
                key={bookmark.id}
                bookmark={bookmark}
                variant={variant}
                unavailableVariant={unavailableVariant}
              />
            ))}
          </SimpleGrid>
          <Text fz={12} c="dimmed" ff="monospace">
            Список
          </Text>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {bookmarks.map((bookmark) => (
              <BookmarkListCard
                key={bookmark.id}
                bookmark={bookmark}
                variant={variant}
                unavailableVariant={unavailableVariant}
              />
            ))}
          </SimpleGrid>
        </Stack>
      </Paper>
      <PhoneFrame>
        <Stack gap="sm">
          <SimpleGrid cols={2} spacing="sm">
            {bookmarks.slice(0, 2).map((bookmark) => (
              <BookmarkGridCard
                key={bookmark.id}
                bookmark={bookmark}
                variant={variant}
                unavailableVariant={unavailableVariant}
              />
            ))}
          </SimpleGrid>
          {first && (
            <BookmarkListCard
              bookmark={first}
              variant={variant}
              unavailableVariant={unavailableVariant}
            />
          )}
        </Stack>
      </PhoneFrame>
    </Stack>
  );
}

export default CardsDemo;
