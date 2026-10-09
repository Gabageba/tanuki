import { Grid, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BOOKMARK_SORT, type BookmarkSort, type SortDirection } from '@tanuki/contracts';
import type { ViewMode } from '@/shared/lib/viewMode';
import SearchInput from '@/shared/ui/SearchInput';
import SortCombobox from '@/shared/ui/SortCombobox';
import ViewModeSwitch from '@/shared/ui/ViewModeSwitch';
import { getBookmarkSortLabel } from '../lib';

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  sort: BookmarkSort;
  onSortChange: (sort: BookmarkSort) => void;
  direction: SortDirection;
  onDirectionChange: (direction: SortDirection) => void;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
};

/**
 * Поиск по названию, сортировка и вид карточек под вкладками. Как в каталоге: от `xs` — в одну
 * строку, на телефоне сортировка с видом переносятся под поиск.
 */
function BookmarksToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  direction,
  onDirectionChange,
  viewMode,
  onViewModeChange,
}: Props) {
  const { t } = useTranslation();
  const sortOptions = Object.values(BOOKMARK_SORT).map((value) => ({
    value,
    label: getBookmarkSortLabel(value, t),
  }));

  return (
    <Grid gap="xs">
      <Grid.Col span={{ base: 12, sm: 'auto' }}>
        <SearchInput
          allowClear
          value={query}
          onChange={onQueryChange}
          placeholder={t('searchByTitle')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 'content' }}>
        <Group gap="xs" wrap="nowrap">
          <SortCombobox
            flex={{ base: 1, sm: 'none' }}
            w={{ sm: 210 }}
            options={sortOptions}
            value={sort}
            onChange={onSortChange}
            direction={direction}
            onDirectionChange={onDirectionChange}
          />
          <ViewModeSwitch value={viewMode} onChange={onViewModeChange} />
        </Group>
      </Grid.Col>
    </Grid>
  );
}

export default BookmarksToolbar;
