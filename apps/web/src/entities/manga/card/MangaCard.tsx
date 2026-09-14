import { type Manga } from '@tanuki/contracts';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';
import MangaGridCard from './MangaGridCard';
import MangaListCard from './MangaListCard';

type Props = {
  manga: Manga;
  viewMode?: ViewMode;
  showSource?: boolean;
};

function MangaCard({ manga, viewMode = VIEW_MODE.GRID, showSource }: Props) {
  if (viewMode === VIEW_MODE.GRID) {
    return <MangaGridCard manga={manga} showSource={showSource} />;
  }

  if (viewMode === VIEW_MODE.LIST) {
    return <MangaListCard manga={manga} />;
  }

  return null;
}

export default MangaCard;
