import { Group } from '@mantine/core';
import { HeartIcon, StarFourIcon } from '@phosphor-icons/react';
import { isEmpty } from '@/shared/lib/isEmpty';
import type { Manga } from '@tanuki/contracts';

type Props = {
  manga: Manga;
};

function MangaScoreMeta({ manga }: Props) {
  const isRatingEmpty = isEmpty(manga.rating);
  const isLikesEmpty = isEmpty(manga.likes);

  if (isRatingEmpty && isLikesEmpty) {
    return null;
  }

  return (
    <Group gap={4}>
      {isRatingEmpty ? (
        <HeartIcon weight="fill" color="white" />
      ) : (
        <StarFourIcon weight="fill" color="white" />
      )}

      {isRatingEmpty ? manga.likes : manga.rating}
    </Group>
  );
}

export default MangaScoreMeta;
