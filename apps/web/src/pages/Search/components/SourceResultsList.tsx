import { Divider, Stack } from '@mantine/core';
import type { ViewMode } from '@tanuki/contracts';
import useTitleBookmarkFolders from '@/entities/bookmark/hooks/useTitleBookmarkFolders';
import type { SearchPlace } from '../models';
import useCollapsedSources from '../hooks/useCollapsedSources';
import SourceResults from './SourceResults';
import SourceResultsSkeleton from './SourceResultsSkeleton';

type Props = {
  places: SearchPlace[];
  query: string;
  viewMode: ViewMode;
};

/**
 * Места источников в порядке пользователя, разделённые линией: ответивший — его секция, ещё не
 * ответивший — скелетон секции. Свёрнутые секции помнятся по id источника — между запросами и
 * перезагрузками, у авторизованного ещё и между устройствами.
 */
function SourceResultsList({ places, query, viewMode }: Props) {
  const getBookmarkFolder = useTitleBookmarkFolders(
    places.flatMap(({ found }) => found?.items.map(({ id }) => id) ?? []),
  );

  const { collapsedIds, toggle } = useCollapsedSources();

  return (
    <Stack gap="xl">
      {places.map(({ sourceId, found }, index) => (
        <Stack key={sourceId} gap="xl">
          {index > 0 && <Divider />}
          {found ? (
            <SourceResults
              group={found}
              query={query}
              viewMode={viewMode}
              isCollapsed={collapsedIds.includes(sourceId)}
              onToggle={() => toggle(sourceId)}
              getBookmarkFolder={getBookmarkFolder}
            />
          ) : (
            <SourceResultsSkeleton viewMode={viewMode} />
          )}
        </Stack>
      ))}
    </Stack>
  );
}

export default SourceResultsList;
