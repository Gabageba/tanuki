import { Group, Text, type MantineColor } from '@mantine/core';
import { HeartIcon, StarFourIcon } from '@phosphor-icons/react';
import { isEmpty } from '@/shared/lib/isEmpty';
import type { TitleScoreData } from './models';

type Props = {
  title: TitleScoreData;
  color?: MantineColor;
};

function TitleScoreMeta({ title, color = 'var(--mantine-color-text)' }: Props) {
  const isRatingEmpty = isEmpty(title.rating);
  const isLikesEmpty = isEmpty(title.likes);

  if (isRatingEmpty && isLikesEmpty) {
    return null;
  }

  return (
    <Group component="span" gap={4} wrap="nowrap" flex="none" c={color}>
      {isRatingEmpty ? (
        <HeartIcon weight="fill" color="var(--mantine-color-terracotta-text)" />
      ) : (
        <StarFourIcon weight="fill" color="var(--mantine-color-terracotta-text)" />
      )}
      <Text span ff="monospace" lh="tight" fw={600}>
        {isRatingEmpty ? title.likes : title.rating}
      </Text>
    </Group>
  );
}

export default TitleScoreMeta;
