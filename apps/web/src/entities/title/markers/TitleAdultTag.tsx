import { Badge, Center } from '@mantine/core';
import { CONTENT_RATING, type ContentRating } from '@tanuki/contracts';
import { TITLE_TAG_HEIGHT } from './models';

type Props = { contentRating: ContentRating };

function TitleAdultTag({ contentRating }: Props) {
  if (contentRating !== CONTENT_RATING.ADULT) return null;

  return (
    <Center h="1lh" fz="sm" lh="tight" flex="none">
      <Badge
        data-card-adult-tag
        variant="muted"
        color="red"
        ff="monospace"
        flex="none"
        h={TITLE_TAG_HEIGHT}
      >
        18+
      </Badge>
    </Center>
  );
}

export default TitleAdultTag;
