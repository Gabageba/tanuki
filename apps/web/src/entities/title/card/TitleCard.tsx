import { type Title } from '@tanuki/contracts';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';
import TitleGridCard from './TitleGridCard';
import TitleListCard from './TitleListCard';

type Props = {
  title: Title;
  viewMode?: ViewMode;
  showSource?: boolean;
};

function TitleCard({ title, viewMode = VIEW_MODE.GRID, showSource }: Props) {
  if (viewMode === VIEW_MODE.GRID) {
    return <TitleGridCard title={title} showSource={showSource} />;
  }

  if (viewMode === VIEW_MODE.LIST) {
    return <TitleListCard title={title} />;
  }

  return null;
}

export default TitleCard;
