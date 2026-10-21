import { Divider, Stack } from '@mantine/core';
import type { ViewMode } from '@tanuki/contracts';
import SourceResultsSkeleton from './SourceResultsSkeleton';

/** Сколько секций источников рисует скелетон, пока идёт веер. */
const SKELETON_SECTIONS = 3;

type Props = {
  viewMode: ViewMode;
};

/** Пока идёт веер — секции источников скелетоном, разделённые линией, как в `SourceResultsList`. */
function SourceResultsListSkeleton({ viewMode }: Props) {
  return (
    <Stack gap="xl">
      {Array.from({ length: SKELETON_SECTIONS }, (_, index) => (
        <Stack key={index} gap="xl">
          {index > 0 && <Divider />}
          <SourceResultsSkeleton viewMode={viewMode} />
        </Stack>
      ))}
    </Stack>
  );
}

export default SourceResultsListSkeleton;
