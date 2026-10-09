import { useContext } from 'react';
import { Group } from '@mantine/core';
import ViewModeSwitch from '@/shared/ui/ViewModeSwitch';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { VIEW_MODE_CONTEXT } from '../models';
import FiltersButton from './FiltersButton';

type Props = {
  filtersCount: number;
};

/** Справа от заголовка: вид карточек, на телефоне — ещё «Фильтры». */
function PageToolbar({ filtersCount }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const { viewMode, setViewMode } = useContext(VIEW_MODE_CONTEXT);

  return (
    <Group gap="xs" wrap="nowrap" flex="none">
      {isPhone && <FiltersButton count={filtersCount} />}
      <ViewModeSwitch value={viewMode} onChange={setViewMode} />
    </Group>
  );
}

export default PageToolbar;
