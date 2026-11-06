import TitleCardGridSkeleton from './components/TitleCardGrid/TitleCardGridSkeleton';
import TitleCardLayout from './components/TitleCardLayout';
import TitleCardListSkeleton from './components/TitleCardList/TitleCardListSkeleton';
import TitleCardActionsSkeleton from './components/TitleCardActionsSkeleton';
import type { TitleCardSkeletonOptions } from './models';

type Props = TitleCardSkeletonOptions;

function TitleCardSkeleton({ viewMode, listSize, withActions = false, ...restProps }: Props) {
  const actions = withActions ? <TitleCardActionsSkeleton /> : null;

  return (
    <TitleCardLayout
      viewMode={viewMode}
      listSize={listSize}
      grid={<TitleCardGridSkeleton {...restProps} actions={actions} />}
      list={<TitleCardListSkeleton {...restProps} actions={actions} />}
    />
  );
}

export default TitleCardSkeleton;
