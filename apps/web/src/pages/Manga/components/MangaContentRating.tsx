import { Badge } from '@mantine/core';
import { getColorByContentRating, getLabelByContentRating } from '@/entities/source/lib';
import type { ContentRating } from '@tanuki/contracts';

type Props = {
  contentRating: ContentRating | null;
};

function MangaContentRating({ contentRating }: Props) {
  if (!contentRating) {
    return null;
  }

  return (
    <Badge color={getColorByContentRating(contentRating)}>
      {getLabelByContentRating(contentRating)}
    </Badge>
  );
}

export default MangaContentRating;
