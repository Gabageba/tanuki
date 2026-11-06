import { Badge } from '@mantine/core';
import { isEmpty } from '@/shared/lib/isEmpty';
import TitleScoreMeta from '../TitleScoreMeta';
import type { TitleScoreData } from '../models';
import { COVER_BADGE_COLOR } from './models';

type Props = {
  title: TitleScoreData;
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
      fz={14}
      px={8}
      radius="md"
      variant="filled"
    >
      <TitleScoreMeta title={title} color="white" />
    </Badge>
  );
}

export default TitleScoreBadge;
