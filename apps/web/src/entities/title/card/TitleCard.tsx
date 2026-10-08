import { type Title } from '@tanuki/contracts';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';
import TitleGridCard from './TitleGridCard';
import TitleListCard from './TitleListCard';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';

type Props = {
  title: Title;
  viewMode?: ViewMode;
  showSource?: boolean;
  bookmarkFolder?: ResolvedBookmarkFolder | null;
};

function TitleCard({ title, viewMode = VIEW_MODE.GRID, showSource, bookmarkFolder }: Props) {
  if (viewMode === VIEW_MODE.GRID) {
    return <TitleGridCard title={title} showSource={showSource} bookmarkFolder={bookmarkFolder} />;
  }

  if (viewMode === VIEW_MODE.LIST) {
    return <TitleListCard title={title} bookmarkFolder={bookmarkFolder} />;
  }

  return null;
}

export default TitleCard;
