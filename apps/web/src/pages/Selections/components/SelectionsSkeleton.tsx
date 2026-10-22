import { Box, Group, Skeleton, Stack } from '@mantine/core';
import SourceTitleSkeleton from '@/entities/source/components/SourceTitle/SourceTitleSkeleton';
import TitleCardsGridSkeleton from '@/entities/title/card/TitleCardsGridSkeleton';
import { getStoredViewMode, VIEW_MODE } from '@/shared/lib/viewMode';
import TabsSkeleton from '@/shared/ui/TabsSkeleton';

/** Ширины названий блоков — разные, чтобы полоса не выглядела штампом. */
const SECTION_TITLE_WIDTHS = [96, 120, 80, 112, 88];

/**
 * Пока не пришёл список источников — та же раскладка, что и у загружающегося блока: строка
 * источника с «Каталогом», вкладки, панель с видом сетки и сетка карточек. Есть ли у блока
 * варианты, ещё неизвестно — слева в панели пусто, как у блока без них.
 */
function SelectionsSkeleton() {
  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Box flex={1} miw={0}>
          <SourceTitleSkeleton />
        </Box>
        <Skeleton h={36} w={112} flex="none" />
      </Group>
      <TabsSkeleton widths={SECTION_TITLE_WIDTHS} />
      <Group justify="flex-end">
        <Skeleton h={36} w={78} />
      </Group>
      <TitleCardsGridSkeleton viewMode={getStoredViewMode() ?? VIEW_MODE.GRID} />
    </Stack>
  );
}

export default SelectionsSkeleton;
