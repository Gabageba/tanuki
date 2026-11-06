import { Box } from '@mantine/core';
import type { SourceId } from '@tanuki/contracts';
import TitleAdultBadge from '@/entities/title/markers/TitleAdultBadge';
import TitleScoreBadge from '@/entities/title/markers/TitleScoreBadge';
import TitleSourceRibbon from '@/entities/title/markers/TitleSourceRibbon';
import BlurredCover from '@/entities/title/BlurredCover';
import HiddenCoverOverlay from '@/entities/title/HiddenCoverOverlay';
import useIsAdultTitleHidden from '@/entities/title/hooks/useIsAdultTitleHidden';
import type { TitleCoverData, TitleScoreData } from '@/entities/title/models';
import CoverImage from '@/shared/ui/CoverImage';
import { TITLE_CARD_HIDDEN_BLUR } from '@/entities/title/card/TitleCard/models';
import styles from '@/entities/title/Title.module.scss';

type Props = {
  title: TitleCoverData & TitleScoreData;
  showBadges?: boolean;
  showSource?: boolean;
};

/** Прежняя отдельная обложка нужна только сохранённым вариантам главной. */
function MockTitleCardImage({ title, showBadges = false, showSource = false }: Props) {
  const isHidden = useIsAdultTitleHidden(title);

  return (
    <Box pos="relative" className={styles.imageWrapper}>
      <BlurredCover blur={isHidden ? TITLE_CARD_HIDDEN_BLUR : 0}>
        <CoverImage src={title.coverUrl} alt={title.name} className={styles.image} />
      </BlurredCover>
      {isHidden && <HiddenCoverOverlay />}
      {showSource && <TitleSourceRibbon sourceId={title.sourceId as SourceId} />}
      {showBadges && (
        <>
          <TitleAdultBadge contentRating={title.contentRating} />
          <TitleScoreBadge title={title} />
        </>
      )}
    </Box>
  );
}

export default MockTitleCardImage;
