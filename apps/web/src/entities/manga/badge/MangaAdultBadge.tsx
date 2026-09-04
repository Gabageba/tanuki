import { Badge, Text } from '@mantine/core';
import type { ContentRating } from '@tanuki/contracts';
import { CONTENT_RATING } from '@tanuki/contracts';

type Props = {
  contentRating: ContentRating;
  compact?: boolean;
};

function MangaAdultBadge({ contentRating, compact }: Props) {
  if (contentRating !== CONTENT_RATING.ADULT) {
    return null;
  }

  return (
    <Badge
      pos="absolute"
      top={compact ? 2 : 6}
      right={compact ? 2 : 6}
      style={{ zIndex: 1 }}
      color="var(--mantine-color-red-2)"
      size={compact ? 'xs' : 'lg'}
      fw={400}
      fz={compact ? 9 : 14}
      px={compact ? 4 : 8}
      radius={compact ? 'sm' : 'md'}
      variant="outline"
      bg="color-mix(in srgb, var(--mantine-color-red-8) 90%, transparent)"
    >
      <Text c="white">18+</Text>
    </Badge>
  );
}

export default MangaAdultBadge;
