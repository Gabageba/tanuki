import { Badge, Text } from '@mantine/core';
import type { ContentRating } from '@tanuki/contracts';
import { CONTENT_RATING } from '@tanuki/contracts';

type Props = {
  contentRating: ContentRating;
};

function MangaAdultBadge({ contentRating }: Props) {
  if (contentRating !== CONTENT_RATING.ADULT) {
    return null;
  }

  return (
    <Badge
      pos="absolute"
      top={6}
      right={6}
      color="var(--mantine-color-red-2)"
      size="lg"
      fw={400}
      fz={14}
      px={8}
      radius="md"
      variant="outline"
      bg="color-mix(in srgb, var(--mantine-color-red-8) 90%, transparent)"
    >
      <Text c="white">18+</Text>
    </Badge>
  );
}

export default MangaAdultBadge;
