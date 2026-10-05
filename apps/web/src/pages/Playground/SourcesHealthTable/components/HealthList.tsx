import {
  DEMO_STATE,
  TABLE_LAYOUT,
  type DemoState,
  type HealthSort,
  type MockSource,
  type SortState,
  type TableLayout,
} from '../models';
import CurrentHealthTable from './CurrentHealthTable';
import HealthEmptyResult from './HealthEmptyResult';
import HealthTable from './HealthTable';
import HealthTableSkeleton from './HealthTableSkeleton';

type Props = {
  sources: MockSource[];
  layout: TableLayout;
  demoState: DemoState;
  sortState: SortState;
  onSortChange: (sort: HealthSort) => void;
  onOpen: (source: MockSource) => void;
  onReset: () => void;
};

/** Скелетон, пустое состояние или таблица — по состоянию из переключателя песочницы. T0 — всегда
 *  нынешняя таблица: скелетона и фильтров у неё нет. */
function HealthList({
  sources,
  layout,
  demoState,
  sortState,
  onSortChange,
  onOpen,
  onReset,
}: Props) {
  if (layout === TABLE_LAYOUT.CURRENT) return <CurrentHealthTable sources={sources} />;
  if (demoState === DEMO_STATE.LOADING) return <HealthTableSkeleton layout={layout} />;
  if (!sources.length) return <HealthEmptyResult onReset={onReset} />;

  return (
    <HealthTable
      sources={sources}
      layout={layout}
      sortState={sortState}
      onSortChange={onSortChange}
      onOpen={onOpen}
    />
  );
}

export default HealthList;
