import { Badge, Text } from '@mantine/core';
import { HeartIcon, StarFourIcon } from '@phosphor-icons/react';
import { isEmpty } from '@/shared/lib/isEmpty';
import type { Manga } from '@tanuki/contracts';

type Props = {
  manga: Manga;
};

function MangaScoreBadge({ manga }: Props) {
  const isRatingEmpty = isEmpty(manga.rating);
  const isLikesEmpty = isEmpty(manga.likes);

  if (isRatingEmpty && isLikesEmpty) {
    return null;
  }

  return (
    <Badge
      pos="absolute"
      bottom={6}
      right={6}
      style={{ zIndex: 1 }}
      color="color-mix(in srgb, var(--mantine-color-dark-filled) 85%, transparent)"
      size="lg"
      fw={400}
      leftSection={
        isRatingEmpty ? (
          <HeartIcon weight="fill" color="var(--mantine-color-terracotta-text)" />
        ) : (
          <StarFourIcon weight="fill" color="var(--mantine-color-terracotta-text)" />
        )
      }
      fz={14}
      px={8}
      radius="md"
      variant="filled"
    >
      <Text c="white" fw={600}>
        {isRatingEmpty ? manga.likes : manga.rating}
      </Text>
    </Badge>
  );
}

export default MangaScoreBadge;
