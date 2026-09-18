import { Group } from '@mantine/core';
import { HeartIcon, StarFourIcon } from '@phosphor-icons/react';
import { isEmpty } from '@/shared/lib/isEmpty';
import type { Title } from '@tanuki/contracts';

type Props = {
  title: Title;
};

function TitleScoreMeta({ title }: Props) {
  const isRatingEmpty = isEmpty(title.rating);
  const isLikesEmpty = isEmpty(title.likes);

  if (isRatingEmpty && isLikesEmpty) {
    return null;
  }

  return (
    <Group gap={4}>
      {isRatingEmpty ? <HeartIcon weight="fill" /> : <StarFourIcon weight="fill" />}
      {isRatingEmpty ? title.likes : title.rating}
    </Group>
  );
}

export default TitleScoreMeta;
