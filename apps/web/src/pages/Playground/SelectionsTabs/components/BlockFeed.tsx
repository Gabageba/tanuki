import { useEffect } from 'react';
import { EmptyState, Stack } from '@mantine/core';
import { SparkleIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import TitleCard from '@/entities/title/card/TitleCard';
import TitleCardSkeleton from '@/entities/title/card/TitleCardSkeleton';
import type { ViewMode } from '@/shared/lib/viewMode';
import useMockFeed from '../hooks/useMockFeed';
import type { BlockEnd, FeedState, MockBlock, NextPageError } from '../models';
import BlockFooter from './BlockFooter';
import BlockGrid from './BlockGrid';

/** Скелетон первой порции — столько карточек, сколько хватает на два-три ряда. */
const SKELETON_CARDS = 12;

type Props = {
  source: Source;
  block: MockBlock;
  state: FeedState;
  viewMode: ViewMode;
  end: BlockEnd;
  nextPageError: NextPageError;
  /** Отдаёт наверх «загрузить следующую порцию» — его зовёт окно прокрутки, дойдя до низа. */
  onLoadMoreChange: (loadMore: () => void) => void;
  /** Период и что внутри блока — при смене блок перемонтируется и грузится заново. */
  salt?: string;
  failNextPageOnce?: boolean;
};

/**
 * Открытый блок сеткой, как каталог: первая порция — скелетоном (вкладки при этом уже настоящие,
 * они известны из `homeSections`), следующие — по прокрутке. Пустой блок — `EmptyState`.
 */
function BlockFeed({
  source,
  block,
  state,
  viewMode,
  end,
  nextPageError,
  onLoadMoreChange,
  salt,
  failNextPageOnce,
}: Props) {
  const { feed, fetchNextPage } = useMockFeed(source, block, state, { salt, failNextPageOnce });

  useEffect(() => {
    onLoadMoreChange(fetchNextPage);
  });

  if (feed.isLoading) {
    return (
      <BlockGrid viewMode={viewMode}>
        {Array.from({ length: SKELETON_CARDS }, (_, index) => (
          <TitleCardSkeleton key={index} viewMode={viewMode} />
        ))}
      </BlockGrid>
    );
  }

  if (feed.items.length === 0) {
    return (
      <EmptyState
        icon={<SparkleIcon />}
        title="В этом блоке сейчас пусто"
        description="Сайт ничего не показывает здесь на главной. Загляните в другой блок."
      />
    );
  }

  return (
    <Stack gap={0}>
      <BlockGrid viewMode={viewMode}>
        {feed.items.map((title) => (
          <TitleCard key={title.id} title={title} viewMode={viewMode} />
        ))}
      </BlockGrid>
      <BlockFooter
        source={source}
        block={block}
        feed={feed}
        end={end}
        nextPageError={nextPageError}
        onRetry={fetchNextPage}
      />
    </Stack>
  );
}

export default BlockFeed;
