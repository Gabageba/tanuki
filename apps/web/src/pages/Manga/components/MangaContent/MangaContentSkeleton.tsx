import { Skeleton, Stack } from '@mantine/core';
import CollapsibleGroupSkeleton from '@/shared/ui/CollapsibleGroup/CollapsibleGroupSkeleton';
import CollapsibleTextSkeleton from '@/shared/ui/CollapsibleText/CollapsibleTextSkeleton';
import MangaMatchesSkeleton from '../MangaMatches/MangaMatchesSkeleton';

function MangaContentSkeleton() {
  return (
    <>
      <Skeleton h={36} py="md" />
      <Stack gap="md">
        <Stack gap={8}>
          <Skeleton h={16} w={110} my={4} />
          <Skeleton h={230} radius="md" />
        </Stack>
        <Stack gap={8}>
          <Skeleton h={16} w={80} my={4} />
          <CollapsibleTextSkeleton textHeight={65.09} />
        </Stack>
        <Stack gap={8}>
          <Skeleton h={16} w={60} my={4} />
          <CollapsibleGroupSkeleton groupHeight={46} gap={6} />
        </Stack>
        <MangaMatchesSkeleton />
      </Stack>
    </>
  );
}

export default MangaContentSkeleton;
