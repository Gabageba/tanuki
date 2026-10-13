import type { BoxProps } from '@mantine/core';
import type { SourceId } from '@tanuki/contracts';
import TitleAdultBadge from './markers/TitleAdultBadge';
import TitleScoreBadge from './markers/TitleScoreBadge';
import TitleSourceRibbon from './markers/TitleSourceRibbon';
import TitleBookmarkMarker from './markers/TitleBookmarkMarker';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import TitleCover from './TitleCover';
import type { TitleCoverData, TitleScoreData } from './models';

type Props = {
  title: TitleCoverData & TitleScoreData;
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
  return (
    <TitleCover cover={title} {...restProps}>
      {showSource && <TitleSourceRibbon sourceId={title.sourceId as SourceId} />}
      {showBadges && (
        <>
          <TitleAdultBadge contentRating={title.contentRating} />
          <TitleScoreBadge title={title} />
        </>
      )}
      {bookmarkFolder && <TitleBookmarkMarker folder={bookmarkFolder} compact={!showBadges} />}
    </TitleCover>
  );
}

export default TitleCardImage;
