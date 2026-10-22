import PageLayout from '@/shared/ui/PageLayout';
import QueryBlock from '@/shared/ui/QueryBlock';
import type useProfileQueries from '../../hooks/useProfileQueries';
import ProfileStatisticsCards from './ProfileStatisticsCards';
import ProfileStatisticsEmpty from './ProfileStatisticsEmpty';
import ProfileStatisticsSkeleton from './ProfileStatisticsSkeleton';

function ProfileStatistics() {
  const { statistics, bookmarkFolders } = PageLayout.useQueries<typeof useProfileQueries>();

  // Карточка закладок берёт папки отдельным запросом — скелетон ждёт и его, иначе она выскочит
  // последней.
  return (
    <QueryBlock
      query={[statistics, bookmarkFolders]}
      skeleton={<ProfileStatisticsSkeleton />}
      empty={<ProfileStatisticsEmpty />}
      isEmpty={([{ hasActivity }]) => !hasActivity}
    >
      {([data]) => <ProfileStatisticsCards statistics={data} />}
    </QueryBlock>
  );
}

export default ProfileStatistics;
