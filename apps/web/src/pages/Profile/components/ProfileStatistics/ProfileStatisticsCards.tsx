import { SimpleGrid, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BooksIcon, FireIcon } from '@phosphor-icons/react';
import useDateFormat from '@/shared/hooks/useDateFormat';
import type { ProfileStatisticsResponse } from '@tanuki/contracts';
import SourcesCard from './cards/SourcesCard';
import ProfileStatisticMetaCard from './cards/ProfileStatisticMetaCard';
import ChaptersReadCard from './cards/ChaptersReadCard';
import ReadingTimeCard from './cards/ReadingTimeCard';
import TagsCard from './cards/TagsCard';
import BookmarksCard from './cards/BookmarksCard';
import { formatSigned, getMonthDeltaPercent, getTodayDelta, getTrendHint } from './lib';

type Props = {
  statistics: ProfileStatisticsResponse;
};

/** Карточки статистики: сегодня, месяц, всё время, серия и графики. */
function ProfileStatisticsCards({ statistics }: Props) {
  const { t } = useTranslation();
  const { getCurrentMonthName } = useDateFormat();
  const { today, month, totals, streak } = statistics;
  const todayDelta = getTodayDelta(statistics);
  const monthDeltaPercent = getMonthDeltaPercent(statistics);

  return (
    <Stack mt="lg">
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
        <ProfileStatisticMetaCard
          label={t('forToday')}
          value={today.chapters}
          unit={t('chapter', { count: today.chapters })}
          hint={
            todayDelta === null
              ? undefined
              : getTrendHint(todayDelta, t('vsAverageDay', { value: formatSigned(todayDelta) }))
          }
        />
        <ProfileStatisticMetaCard
          label={t('forMonth', { month: getCurrentMonthName() })}
          value={month.chapters}
          unit={t('chapter', { count: month.chapters })}
          hint={
            monthDeltaPercent === null
              ? undefined
              : getTrendHint(
                  monthDeltaPercent,
                  t('vsUsualPace', { value: `${formatSigned(monthDeltaPercent)}%` }),
                )
          }
        />
        <ProfileStatisticMetaCard
          label={t('allTime')}
          value={totals.chapters}
          unit={t('chapter', { count: totals.chapters })}
          hint={{ icon: <BooksIcon />, text: t('countTitles', { count: totals.titles }) }}
        />
        <ProfileStatisticMetaCard
          label={t('dayStreak')}
          value={streak.current}
          unit={t('day', { count: streak.current })}
          hint={
            streak.best > 0
              ? {
                  icon: <FireIcon />,
                  text: t('personalBest', { value: streak.best }),
                  color: 'terracotta',
                }
              : undefined
          }
        />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <ChaptersReadCard
          chaptersByDay={statistics.chaptersByDay}
          chaptersByMonth={statistics.chaptersByMonth}
        />
        <ReadingTimeCard readingTime={statistics.readingTime} />
        <TagsCard tags={statistics.tags} />
        <SourcesCard sources={statistics.sources} />
        <BookmarksCard />
      </SimpleGrid>
    </Stack>
  );
}

export default ProfileStatisticsCards;
