import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';
import type { SourceId } from '@tanuki/contracts';
import { type Title } from '@tanuki/contracts';
import TitleAdultBadge from './markers/TitleAdultBadge';
import TitleScoreBadge from './markers/TitleScoreBadge';
import TitleSourceRibbon from './markers/TitleSourceRibbon';
import CoverImage from '@/shared/ui/CoverImage';
import useIsAdultTitleHidden from './hooks/useIsAdultTitleHidden';
import HiddenCoverOverlay from './HiddenCoverOverlay';
import styles from './Title.module.scss';

type Props = {
  title: Title;
  showBadges?: boolean;
  showSource?: boolean;
} & Omit<BoxProps, 'pos' | 'className'>;

function TitleCardImage({ title, showBadges = false, showSource = false, ...restProps }: Props) {
  const isHidden = useIsAdultTitleHidden(title);

  return (
    <Box pos="relative" className={styles.imageWrapper} {...restProps}>
      {showSource && <TitleSourceRibbon sourceId={title.sourceId as SourceId} />}
      {showBadges && (
        <>
          <TitleAdultBadge contentRating={title.contentRating} />
          <TitleScoreBadge title={title} />
        </>
      )}
      <CoverImage src={title.coverUrl} alt={title.name} className={styles.image} />
      {isHidden && <HiddenCoverOverlay />}
    </Box>
  );
}

export default TitleCardImage;
