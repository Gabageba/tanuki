import { useContext, type ReactNode } from 'react';
import { SimpleGrid } from '@mantine/core';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { DISCOVER_PATH, MOCK_HOME_ALL } from '../mocks';
import SourceEntryCard from './SourceEntryCard';

type Props = {
  /** V3 — плитка последней ячейкой сетки. */
  trailing?: ReactNode;
};

/** P4a — карточки источников, каждая ведёт на страницу подборок этого источника. */
function SourceEntryGrid({ trailing }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);

  return (
    <SimpleGrid cols={isPhone ? 2 : 4} spacing="md">
      {MOCK_HOME_ALL.map((home) => (
        <SourceEntryCard
          key={home.source.id}
          home={home}
          to={`${DISCOVER_PATH}/${home.source.id}`}
        />
      ))}
      {trailing}
    </SimpleGrid>
  );
}

export default SourceEntryGrid;
