import { useSearchParams } from 'react-router';
import type { FilterSelection } from '@tanuki/contracts';
import PageLayout from '@/shared/ui/PageLayout';
import { serializeFilters } from '@/features/filters/lib/filterSelection';
import type { CatalogParams } from '../models';

/** Меняет фильтры каталога разом в параметрах запроса и в адресе. */
function useSetCatalogFilters() {
  const { params, setParams } = PageLayout.useParams<CatalogParams>();
  const [, setSearchParams] = useSearchParams();

  return (next: FilterSelection[]) => {
    setParams({ ...params, filters: next });
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        nextParams.delete('filters');
        for (const value of serializeFilters(next)) {
          nextParams.append('filters', value);
        }
        return nextParams;
      },
      { replace: true },
    );
  };
}

export default useSetCatalogFilters;
