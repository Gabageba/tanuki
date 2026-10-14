import { Stack } from '@mantine/core';
import SourceTitleSkeleton from '@/entities/source/components/SourceTitle/SourceTitleSkeleton';
import TitleCardsGridSkeleton from '@/entities/title/card/TitleCardsGridSkeleton';
import { getStoredViewMode, VIEW_MODE } from '@/shared/lib/viewMode';

/** Пока не пришёл список источников: строка источника и сетка карточек скелетоном — какие у
 *  источника вкладки, ещё неизвестно. */
function SelectionsSkeleton() {
  return (
    <Stack gap="lg">
      <SourceTitleSkeleton />
      <TitleCardsGridSkeleton viewMode={getStoredViewMode() ?? VIEW_MODE.GRID} />
    </Stack>
  );
}

export default SelectionsSkeleton;
