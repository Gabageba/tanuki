import { VIEW_MODE, type SourceId } from '@tanuki/contracts';
import TitleBookmarkMarker from '@/entities/title/markers/TitleBookmarkMarker';
import TitleScoreBadge from '@/entities/title/markers/TitleScoreBadge';
import TitleSourceRibbon from '@/entities/title/markers/TitleSourceRibbon';
import useTitleCardLayout from '../../hooks/useTitleCardLayout';
import type { TitleCardData } from '../../models';

type Props = { data: TitleCardData; showSource?: boolean };

function TitleCardDecorations({ data, showSource }: Props) {
  const { viewMode } = useTitleCardLayout();
  const isGrid = viewMode === VIEW_MODE.GRID;

  return (
    <>
      {isGrid && (
        <>
          {showSource && <TitleSourceRibbon sourceId={data.sourceId as SourceId} />}
          <TitleScoreBadge title={data} />
        </>
      )}
      <TitleBookmarkMarker folder={data.bookmarkFolder} compact={!isGrid} />
    </>
  );
}

export default TitleCardDecorations;
