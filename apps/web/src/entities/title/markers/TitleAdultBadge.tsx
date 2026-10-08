import { Badge, Text } from '@mantine/core';
import type { ContentRating } from '@tanuki/contracts';
import { CONTENT_RATING } from '@tanuki/contracts';

type Props = {
  contentRating: ContentRating;
  compact?: boolean;
};

function TitleAdultBadge({ contentRating, compact }: Props) {
  if (contentRating !== CONTENT_RATING.ADULT) {
    return null;
  }

  return (
    <Badge
      pos="absolute"
      top={compact ? 2 : 6}
      right={compact ? 2 : 6}
      style={{ zIndex: 1 }}
      size={compact ? 'xs' : 'lg'}
      fw={400}
      fz={compact ? 12 : 14}
      px={compact ? 4 : 8}
      radius={compact ? 'sm' : 'md'}
      variant="filled"
      color="color-mix(in srgb, var(--mantine-color-crimson-7) 90%, transparent)"
    >
      <Text c="white" fw={600} ff="monospace">
        18+
      </Text>
    </Badge>
  );
}

export default TitleAdultBadge;
