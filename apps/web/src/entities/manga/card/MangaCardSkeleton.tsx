import type { ViewMode } from '@/shared/lib/viewMode';
import { VIEW_MODE } from '@/shared/lib/viewMode';
import MangaGridCardSkeleton from './MangaGridCard/MangaGridCardSkeleton';
import MangaListCardSkeleton from './MangaListCard/MangaListCardSkeleton';

type Props = {
  viewMode: ViewMode;
};

function MangaCardSkeleton({ viewMode }: Props) {
  if (viewMode === VIEW_MODE.GRID) {
    return <MangaGridCardSkeleton />;
  }

  if (viewMode === VIEW_MODE.LIST) {
    return <MangaListCardSkeleton />;
  }

  return null;
}

export default MangaCardSkeleton;
