import { FunnelIcon } from '@phosphor-icons/react';
import CompactMultiSelect from '@/shared/ui/CompactMultiSelect';
import { getCategoryLabel } from '../lib';
import type { MockCategory } from '../models';

type Props = {
  categories: MockCategory[];
  selected: MockCategory[];
  onChange: (selected: MockCategory[]) => void;
};

/** F1: общий `CompactMultiSelect`, пустой выбор — без ограничения. */
function FilterSelect({ categories, selected, onChange }: Props) {
  return (
    <CompactMultiSelect
      value={selected}
      onChange={(next) => onChange(categories.filter((category) => next.includes(category)))}
      data={categories.map((category) => ({ value: category, label: getCategoryLabel(category) }))}
      placeholder="Все категории"
      aria-label="Категории"
      leftSection={<FunnelIcon size={16} />}
      clearable
      miw={0}
      flex={1}
      maw={360}
    />
  );
}

export default FilterSelect;
