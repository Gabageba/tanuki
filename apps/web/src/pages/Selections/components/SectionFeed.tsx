import { EmptyState, Stack } from '@mantine/core';
import { SparkleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import useTitleBookmarkFolders from '@/entities/bookmark/hooks/useTitleBookmarkFolders';
import TitleCard from '@/entities/title/card/TitleCard';
import TitleCardsGridSkeleton from '@/entities/title/card/TitleCardsGridSkeleton';
import type { ViewMode } from '@/shared/lib/viewMode';
import PageLayout from '@/shared/ui/PageLayout';
import ViewModeGrid from '@/shared/ui/ViewModeGrid';
import type useSelectionsSection from '../hooks/useSelectionsSection';
import SectionEnd from './SectionEnd';

type Props = {
  query: ReturnType<typeof useSelectionsSection>;
  viewMode: ViewMode;
};

/**
 * Открытый блок сеткой, как каталог: первая порция — скелетоном (вкладки уже настоящие), дальше
 * — по прокрутке. Пустой блок — `EmptyState` во вкладке; ошибку запроса блок не рисует.
 */
function SectionFeed({ query, viewMode }: Props) {
  const { t } = useTranslation();
  const pages = query.data?.pages ?? [];
  // Сайт мог сдвинуть блок между порциями — тайтл на стыке пришёл бы дважды.
  const items = [
    ...new Map(pages.flatMap((page) => page.items).map((title) => [title.id, title])).values(),
  ];
  const getBookmarkFolder = useTitleBookmarkFolders(items.map(({ id }) => id));

  if (query.isPending) {
    return <TitleCardsGridSkeleton viewMode={viewMode} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<SparkleIcon />}
        title={t('blockIsEmptyNow')}
        description={t('nothingHereTryOtherBlock')}
      />
    );
  }

  return (
    <Stack gap={0}>
      <ViewModeGrid viewMode={viewMode}>
        {items.map((title) => (
          <TitleCard
            key={title.id}
            title={title}
            viewMode={viewMode}
            bookmarkFolder={getBookmarkFolder(title.id)}
          />
        ))}
      </ViewModeGrid>
      <SectionEnd hasNextPage={query.hasNextPage} />
      <PageLayout.InfiniteScrollTrigger query={query} />
    </Stack>
  );
}

export default SectionFeed;
