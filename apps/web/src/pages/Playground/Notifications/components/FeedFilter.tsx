import { FILTER, type Filter, type MockCategory } from '../models';
import FilterChips from './FilterChips';
import FilterSegments from './FilterSegments';
import FilterSelect from './FilterSelect';

type Props = {
  filter: Filter;
  categories: MockCategory[];
  selected: MockCategory[];
  onChange: (selected: MockCategory[]) => void;
  counts: Partial<Record<MockCategory, number>>;
  total: number;
};

/** Фильтр категорий одного из трёх видов. */
function FeedFilter({ filter, categories, selected, onChange, counts, total }: Props) {
  switch (filter) {
    case FILTER.SELECT:
      return <FilterSelect categories={categories} selected={selected} onChange={onChange} />;
    case FILTER.CHIPS:
      return <FilterChips categories={categories} selected={selected} onChange={onChange} />;
    case FILTER.SEGMENTS:
      return (
        <FilterSegments
          categories={categories}
          selected={selected}
          onChange={onChange}
          counts={counts}
          total={total}
        />
      );
  }
}

export default FeedFilter;
