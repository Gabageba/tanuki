import { Box, Group, Stack } from '@mantine/core';
import { CaretDownIcon } from '@phosphor-icons/react';
import { VIEW_MODE, type ViewMode } from '@tanuki/contracts';
import SourceTitleSkeleton from '@/entities/source/components/SourceTitle/SourceTitleSkeleton';
import SourceTitleCardSkeleton from '@/entities/source/components/SourceTitleCard/SourceTitleCardSkeleton';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { LIST_PREVIEW_COUNT } from '../models';

/** Обложек в ленте скелетона — с запасом на широкий экран, лишние обрезаются. */
const SCROLLER_CARDS = 8;

type Props = {
  viewMode: ViewMode;
};

/** Секция источника скелетоном: название с «Все результаты» и карточки — лентой или списком. */
function SourceResultsSkeleton({ viewMode }: Props) {
  return (
    <Stack gap="sm">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Group gap="xs" wrap="nowrap" flex={1} miw={0}>
          <CaretDownIcon color="var(--mantine-color-dimmed)" />
          <SourceTitleSkeleton />
        </Group>
        <TextSkeleton fz="sm" w={110} flex="none" />
      </Group>
      {viewMode === VIEW_MODE.LIST ? (
        <Stack gap="sm">
          {Array.from({ length: LIST_PREVIEW_COUNT }, (_, index) => (
            <SourceTitleCardSkeleton key={index} viewMode={VIEW_MODE.LIST} />
          ))}
        </Stack>
      ) : (
        <Group gap="md" wrap="nowrap" align="flex-start" style={{ overflow: 'hidden' }}>
          {Array.from({ length: SCROLLER_CARDS }, (_, index) => (
            <Box key={index} w={{ base: 128, sm: 168 }} flex="none">
              <SourceTitleCardSkeleton viewMode={VIEW_MODE.GRID} />
            </Box>
          ))}
        </Group>
      )}
    </Stack>
  );
}

export default SourceResultsSkeleton;
