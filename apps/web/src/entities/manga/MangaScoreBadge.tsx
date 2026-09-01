import { Badge } from '@mantine/core';
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
      color="dark"
      size="lg"
      fw={400}
      leftSection={isRatingEmpty ? <HeartIcon weight="fill" /> : <StarFourIcon weight="fill" />}
      fz={14}
      px={8}
      radius="md"
      bg="color-mix(in srgb, var(--mantine-color-dark-filled) 85%, transparent)"
    >
      {isRatingEmpty ? manga.likes : manga.rating}
    </Badge>
  );
}

export default MangaScoreBadge;
