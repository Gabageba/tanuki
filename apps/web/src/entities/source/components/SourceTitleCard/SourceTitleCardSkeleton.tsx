import type { ViewMode } from '@tanuki/contracts';
import TitleCardSkeleton from '@/entities/title/card/TitleCard/TitleCardSkeleton';
import SourceTitleMetaSkeleton from './components/SourceTitleMetaSkeleton';
import SourceTitleFooterSkeleton from './components/SourceTitleFooterSkeleton';

type Props = { viewMode: ViewMode };

function SourceTitleCardSkeleton({ viewMode }: Props) {
  return (
    <TitleCardSkeleton
      viewMode={viewMode}
      withDescription
      meta={<SourceTitleMetaSkeleton />}
      footer={<SourceTitleFooterSkeleton />}
    />
  );
}

export default SourceTitleCardSkeleton;
