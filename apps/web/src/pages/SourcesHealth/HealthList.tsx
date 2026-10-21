import type { SortDirection, Source } from '@tanuki/contracts';
import HealthEmptyResult from './HealthEmptyResult';
import HealthTable from './HealthTable';
import type { HealthSort } from './models';

type Props = {
  sources: Source[];
  sort: HealthSort;
  direction: SortDirection;
  onSortChange: (sort: HealthSort) => void;
  onOpen: (source: Source) => void;
  onReset: () => void;
};

/** «Ничего не найдено» или таблица. Без фильтров источники есть всегда, поэтому отдельного «пока
 *  нет» не нужно. */
function HealthList({ sources, sort, direction, onSortChange, onOpen, onReset }: Props) {
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
