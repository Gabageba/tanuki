import { Avatar } from '@mantine/core';
import { SquaresFourIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { MOCK_HOME_ALL, MOCK_SOURCES_TOTAL } from '../mocks';
import EntryTile from './EntryTile';

/** V2 — плитка «Источники» с рядом логотипов: ведёт в /sources, к каталогам всех сайтов. */
function SourcesTile() {
  return (
    <EntryTile
      to={ROUTE_PATHS.SOURCES}
      icon={<SquaresFourIcon size={22} />}
      title="Источники"
      description={`Каталоги всех ${MOCK_SOURCES_TOTAL} сайтов с фильтрами и поиском`}
      visual={
        <Avatar.Group spacing="sm" flex="none">
          {MOCK_HOME_ALL.slice(0, 3).map(({ source }) => (
            <SourceIcon key={source.id} id={source.id} title={source.title} size={32} />
          ))}
        </Avatar.Group>
      }
    />
  );
}

export default SourcesTile;
