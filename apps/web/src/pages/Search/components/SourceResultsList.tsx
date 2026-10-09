import { Divider, Stack } from '@mantine/core';
import type { ViewMode } from '@tanuki/contracts';
import useTitleBookmarkFolders from '@/entities/bookmark/hooks/useTitleBookmarkFolders';
import type { FoundGroup } from '../models';
import useCollapsedSources from '../hooks/useCollapsedSources';
import SourceResults from './SourceResults';

type Props = {
  found: FoundGroup[];
  query: string;
  viewMode: ViewMode;
};

/**
 * Секции источников в порядке пользователя, разделённые линией. Свёрнутые секции помнятся по id
 * источника — между запросами и перезагрузками, у авторизованного ещё и между устройствами.
 */
function SourceResultsList({ found, query, viewMode }: Props) {
  const getBookmarkFolder = useTitleBookmarkFolders(
    found.flatMap(({ items }) => items.map(({ id }) => id)),
  );

  const { collapsedIds, toggle } = useCollapsedSources();

  return (
    <Stack gap="xl">
      {found.map((group, index) => (
        <Stack key={group.source.id} gap="xl">
          {index > 0 && <Divider />}
          <SourceResults
            group={group}
            query={query}
            viewMode={viewMode}
            isCollapsed={collapsedIds.includes(group.source.id)}
            onToggle={() => toggle(group.source.id)}
            getBookmarkFolder={getBookmarkFolder}
          />
        </Stack>
      ))}
    </Stack>
  );
}

export default SourceResultsList;
