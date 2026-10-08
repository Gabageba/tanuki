import { Badge, Text } from '@mantine/core';
import { HeartIcon, StarFourIcon } from '@phosphor-icons/react';
import { isEmpty } from '@/shared/lib/isEmpty';
import type { Title } from '@tanuki/contracts';
import { COVER_BADGE_COLOR } from './models';

type Props = {
  title: Title;
};

function TitleScoreBadge({ title }: Props) {
  const isRatingEmpty = isEmpty(title.rating);
  const isLikesEmpty = isEmpty(title.likes);

  if (isRatingEmpty && isLikesEmpty) {
    return null;
  }

  return (
    <Badge
      pos="absolute"
      bottom={6}
      right={6}
      style={{ zIndex: 1 }}
      color={COVER_BADGE_COLOR}
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
      <Text c="white" fw={600} ff="monospace">
        {isRatingEmpty ? title.likes : title.rating}
      </Text>
    </Badge>
  );
}

export default TitleScoreBadge;
