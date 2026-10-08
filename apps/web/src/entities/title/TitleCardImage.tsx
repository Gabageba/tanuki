import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';
import type { SourceId } from '@tanuki/contracts';
import { type Title } from '@tanuki/contracts';
import TitleAdultBadge from './markers/TitleAdultBadge';
import TitleScoreBadge from './markers/TitleScoreBadge';
import TitleSourceRibbon from './markers/TitleSourceRibbon';
import TitleBookmarkMarker from './markers/TitleBookmarkMarker';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import CoverImage from '@/shared/ui/CoverImage';
import useIsAdultTitleHidden from './hooks/useIsAdultTitleHidden';
import HiddenCoverOverlay from './HiddenCoverOverlay';
import BlurredCover from './BlurredCover';
import { HIDDEN_COVER_BLUR } from './models';
import styles from './Title.module.scss';

type Props = {
  title: Title;
  showBadges?: boolean;
  showSource?: boolean;
  /** Папка закладки тайтла — метка в левом нижнем углу; null — не в закладках. */
  bookmarkFolder?: ResolvedBookmarkFolder | null;
} & Omit<BoxProps, 'pos' | 'className'>;

function TitleCardImage({
  title,
  showBadges = false,
  showSource = false,
  bookmarkFolder,
  ...restProps
}: Props) {
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
      <BlurredCover blur={isHidden ? HIDDEN_COVER_BLUR : 0}>
        <CoverImage src={title.coverUrl} alt={title.name} className={styles.image} />
      </BlurredCover>
      {isHidden && <HiddenCoverOverlay />}
      {bookmarkFolder && <TitleBookmarkMarker folder={bookmarkFolder} compact={!showBadges} />}
    </Box>
  );
}

export default TitleCardImage;
