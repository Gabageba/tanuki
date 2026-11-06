import { SimpleGrid } from '@mantine/core';
import { VIEW_MODE, type ViewMode } from '@tanuki/contracts';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import type { Example } from '../models';

type Props = { examples: Example[]; phone: boolean; viewMode: ViewMode };

function OrdinaryFeed({ examples, phone, viewMode }: Props) {
  const getColumns = () => {
    switch (viewMode) {
      case VIEW_MODE.GRID:
        return phone ? 2 : 4;
      case VIEW_MODE.LIST:
        return 1;
    }
  };

  return (
    <SimpleGrid cols={getColumns()} spacing="md">
      {examples.map(({ title, folder }) => (
        <SourceTitleCard key={title.id} title={title} bookmarkFolder={folder} viewMode={viewMode} />
      ))}
    </SimpleGrid>
  );
}

export default OrdinaryFeed;
