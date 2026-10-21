import { Button, EmptyState } from '@mantine/core';
import { BooksIcon, FunnelIcon, FunnelXIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import useSource from '@/entities/source/hooks/useSource';
import type { CatalogParams } from '../../../models';
import { isFiltersLockedByQuery } from '../../../utils/sortOrder';
import useSetCatalogFilters from '../../../hooks/useSetCatalogFilters';

type Props = {
  sourceId: string | undefined;
};

/**
 * Источник не вернул ни одного тайтла. При выбранных фильтрах — «Сбросить фильтры», при поиске
 * по названию — подсказка про написание.
 */
function CatalogEmpty({ sourceId }: Props) {
  const { t } = useTranslation();
  const { data: source } = useSource({ sourceId });
  const { params } = PageLayout.useParams<CatalogParams>();
  const setFilters = useSetCatalogFilters();

  const withFilters =
    !isFiltersLockedByQuery(source, params.query) && (params.filters?.length ?? 0) > 0;

  if (withFilters) {
    return (
      <EmptyState
        title={t('nothingFound')}
        description={t('noTitleMatchesFilters')}
        icon={<FunnelIcon />}
      >
        <EmptyState.Actions>
          <Button variant="default" leftSection={<FunnelXIcon />} onClick={() => setFilters([])}>
            {t('resetFilters')}
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    );
  }

  if (params.query) {
    return (
      <EmptyState
        title={t('nothingFound')}
        description={t('tryOtherSpellingOrOriginalTitle')}
        icon={<MagnifyingGlassIcon />}
      />
    );
  }

  return <EmptyState title={t('noTitlesInCatalog')} icon={<BooksIcon />} />;
}

export default CatalogEmpty;
