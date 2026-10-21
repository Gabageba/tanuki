import { EmptyState, Stack } from '@mantine/core';
import { SparkleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import TitleCardsGrid from '@/entities/title/card/TitleCardsGrid';
import TitleCardsGridSkeleton from '@/entities/title/card/TitleCardsGridSkeleton';
import type { ViewMode } from '@/shared/lib/viewMode';
import PageLayout from '@/shared/ui/PageLayout';
import QueryBlock from '@/shared/ui/QueryBlock';
import type useSelectionsSection from '../hooks/useSelectionsSection';
import { getSectionTitles } from '../lib';
import SectionEnd from './SectionEnd';

type Props = {
  query: ReturnType<typeof useSelectionsSection>;
  viewMode: ViewMode;
};

/**
 * Открытый блок сеткой, как каталог: первая порция — скелетоном (вкладки уже настоящие), дальше
 * — по прокрутке. Пустой блок — `EmptyState` во вкладке; упавший запрос — тоже он, об ошибке
 * скажет уведомление.
 */
function SectionFeed({ query, viewMode }: Props) {
  const { t } = useTranslation();

  return (
    <QueryBlock
      query={query}
      skeleton={<TitleCardsGridSkeleton viewMode={viewMode} />}
      empty={
        <EmptyState
          icon={<SparkleIcon />}
          title={t('blockIsEmptyNow')}
          description={t('nothingHereTryOtherBlock')}
        />
      }
      isEmpty={({ pages }) => pages.every(({ items }) => items.length === 0)}
    >
      {({ pages }) => (
        <Stack gap={0}>
          <TitleCardsGrid titles={getSectionTitles(pages)} viewMode={viewMode} />
          <SectionEnd hasNextPage={query.hasNextPage} />
          <PageLayout.InfiniteScrollTrigger query={query} />
        </Stack>
      )}
    </QueryBlock>
  );
}

export default SectionFeed;
