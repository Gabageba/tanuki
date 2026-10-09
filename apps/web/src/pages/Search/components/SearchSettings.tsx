import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FilterSelection, Source, ViewMode } from '@tanuki/contracts';
import FilterBar from '@/features/filters/FilterBar';
import ViewModeSwitch from '@/shared/ui/ViewModeSwitch';
import { buildSearchFilterGroups, fromFilterSelection, toFilterSelection } from '../lib';
import type { SearchFilters } from '../models';

type Props = {
  sources: Source[];
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
};

/**
 * Строка над выдачей — как в каталоге, без сортировки: «Фильтры» раскрывают карточку групп (на
 * телефоне — drawer), вид карточек у правого края, выбранное — пилюлями ниже. На телефоне вид
 * остаётся справа от кнопки в той же строке.
 */
function SearchSettings({ sources, filters, onFiltersChange, viewMode, onViewModeChange }: Props) {
  const { t } = useTranslation();
  const groups = useMemo(() => buildSearchFilterGroups(sources, t), [sources, t]);
  const selection = toFilterSelection(filters);
  const handleChange = (next: FilterSelection[]) => onFiltersChange(fromFilterSelection(next));

  return (
    <FilterBar
      groups={groups}
      selection={selection}
      onChange={handleChange}
      inlineActions
      actions={<ViewModeSwitch value={viewMode} onChange={onViewModeChange} />}
    />
  );
}

export default SearchSettings;
