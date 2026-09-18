import { Skeleton, Stack } from '@mantine/core';
import CollapsibleGroupSkeleton from '@/shared/ui/CollapsibleGroup/CollapsibleGroupSkeleton';
import CollapsibleTextSkeleton from '@/shared/ui/CollapsibleText/CollapsibleTextSkeleton';
import TitleMatchesSkeleton from '../TitleMatches/TitleMatchesSkeleton';
import TitleInfoSkeleton from '../TitleInfo/TitleInfoSkeleton';

function TitleContentSkeleton() {
  return (
    <>
      <Skeleton h={36} py="md" />
      <Stack gap="md">
        <Stack gap={8}>
          <Skeleton h={16} w={250} my={4} />
          <CollapsibleTextSkeleton textHeight={65.09} />
        </Stack>
        <Stack gap={8}>
          <Skeleton h={16} w={250} my={4} />
          <CollapsibleGroupSkeleton groupHeight={46} gap={6} />
        </Stack>
        <TitleMatchesSkeleton />
        <TitleInfoSkeleton />
      </Stack>
    </>
  );
}

export default TitleContentSkeleton;
