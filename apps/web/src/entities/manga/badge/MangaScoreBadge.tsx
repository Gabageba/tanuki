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
      color="white"
      size="lg"
      fw={400}
      leftSection={
        isRatingEmpty ? (
          <HeartIcon weight="fill" color="white" />
        ) : (
          <StarFourIcon weight="fill" color="white" />
        )
      }
      fz={14}
      px={8}
      radius="md"
      variant="outline"
      bg="color-mix(in srgb, var(--mantine-color-dark-filled) 85%, transparent)"
    >
      <Text c="white">{isRatingEmpty ? manga.likes : manga.rating}</Text>
    </Badge>
  );
}

export default MangaScoreBadge;
