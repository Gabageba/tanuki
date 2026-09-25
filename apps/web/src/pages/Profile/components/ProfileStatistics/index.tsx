import { SimpleGrid, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BooksIcon, FireIcon, TrendDownIcon, TrendUpIcon } from '@phosphor-icons/react';
import SourcesCard from './cards/SourcesCard';
import useDateFormat from '@/shared/hooks/useDateFormat';
import ProfileStatisticMetaCard from './cards/ProfileStatisticMetaCard';
import ChaptersReadCard from './cards/ChaptersReadCard';
import ReadingTimeCard from './cards/ReadingTimeCard';
import GenresCard from './cards/GentresCard';

function ProfileStatistics() {
  const { t } = useTranslation();
  const { getCurrentMonthName } = useDateFormat();

  return (
    <Stack mt="lg">
      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <ProfileStatisticMetaCard
          label={t('forToday')}
          value={9}
          unit={t('chapter', { count: 9 })}
          hint={{ icon: <TrendUpIcon />, text: t('vsAverageDay', { value: '+3' }), color: 'green' }}
        />
        <ProfileStatisticMetaCard
          label={t('forMonth', { month: getCurrentMonthName() })}
          value={214}
          unit={t('chapter', { count: 214 })}
          hint={{ icon: <TrendDownIcon />, text: t('vsLastMonth', { value: '−9%' }), color: 'red' }}
        />
        <ProfileStatisticMetaCard
          label={t('allTime')}
          value={4218}
          unit={t('chapter', { count: 4218 })}
          hint={{
            icon: <BooksIcon />,
            text: t('countTitlesFinished', { count: 148, finished: 61 }),
          }}
        />
        <ProfileStatisticMetaCard
          label={t('dayStreak')}
          value={23}
          unit={t('day', { count: 23 })}
          hint={{ icon: <FireIcon />, text: t('personalBest', { value: 41 }), color: 'terracotta' }}
        />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <ChaptersReadCard />
        <ReadingTimeCard />
        <GenresCard />
        <SourcesCard />
      </SimpleGrid>
    </Stack>
  );
}

export default ProfileStatistics;
