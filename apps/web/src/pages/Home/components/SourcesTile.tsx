import { Avatar } from '@mantine/core';
import { SquaresFourIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import useSources from '@/entities/source/hooks/useSources';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { flattenSources } from '@/entities/source/lib';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import EntryTile from './EntryTile';

/** Сколько логотипов в ряду на плитке. */
const LOGOS_COUNT = 3;

/** Плитка «Источники» (V2a) с рядом логотипов — в /sources, к каталогам всех сайтов. */
function SourcesTile() {
  const { t } = useTranslation();
  const { data } = useSources();
  const sources = flattenSources(data).filter(({ isEnabled }) => isEnabled);

  return (
    <EntryTile
      to={ROUTE_PATHS.SOURCES}
      icon={<SquaresFourIcon size={22} />}
      title={t('sources')}
      description={t('catalogsOfAllSitesWithFiltersAndSearch', { count: sources.length })}
      visual={
        <Avatar.Group spacing="sm" flex="none">
          {sources.slice(0, LOGOS_COUNT).map((source) => (
            <SourceIcon key={source.id} id={source.id} title={source.title} size={32} />
          ))}
        </Avatar.Group>
      }
    />
  );
}

export default SourcesTile;
