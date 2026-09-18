import type { ViewMode } from '@/shared/lib/viewMode';
import { VIEW_MODE } from '@/shared/lib/viewMode';
import TitleGridCardSkeleton from './TitleGridCard/TitleGridCardSkeleton';
import TitleListCardSkeleton from './TitleListCard/TitleListCardSkeleton';

type Props = {
  viewMode: ViewMode;
};

function TitleCardSkeleton({ viewMode }: Props) {
  if (viewMode === VIEW_MODE.GRID) {
    return <TitleGridCardSkeleton />;
  }

  if (viewMode === VIEW_MODE.LIST) {
    return <TitleListCardSkeleton />;
  }

  return null;
}

export default TitleCardSkeleton;
