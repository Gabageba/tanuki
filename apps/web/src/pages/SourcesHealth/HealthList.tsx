import type { SortDirection, Source } from '@tanuki/contracts';
import HealthEmptyResult from './HealthEmptyResult';
import HealthTable from './HealthTable';
import HealthTableSkeleton from './HealthTableSkeleton';
import type { HealthSort } from './models';

type Props = {
  sources: Source[];
  isPending: boolean;
  sort: HealthSort;
  direction: SortDirection;
  onSortChange: (sort: HealthSort) => void;
  onOpen: (source: Source) => void;
  onReset: () => void;
};

/** Скелетон на первой загрузке, «ничего не найдено» или таблица. Без фильтров источники есть
 *  всегда, поэтому отдельного «пока нет» не нужно. */
function HealthList({ sources, isPending, sort, direction, onSortChange, onOpen, onReset }: Props) {
  if (isPending) {
    return <HealthTableSkeleton />;
  }

  if (!sources.length) {
    return <HealthEmptyResult onReset={onReset} />;
  }

  return (
    <HealthTable
      sources={sources}
      sort={sort}
      direction={direction}
      onSortChange={onSortChange}
      onOpen={onOpen}
    />
  );
}

export default HealthList;
