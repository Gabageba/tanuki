import { Skeleton, Stack } from '@mantine/core';
import CollapsibleGroupSkeleton from '@/shared/ui/CollapsibleGroup/CollapsibleGroupSkeleton';
import CollapsibleTextSkeleton from '@/shared/ui/CollapsibleText/CollapsibleTextSkeleton';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import TitleMatchesSkeleton from '../TitleMatches/TitleMatchesSkeleton';
import TitleInfoSkeleton from '../TitleInfo/TitleInfoSkeleton';

function TitleContentSkeleton() {
  return (
    <>
      <Skeleton h={36} py="md" />
      <Stack gap="md">
        <Stack gap={8}>
          <TextSkeleton fz="h5" lh="h5" w={250} />
          <CollapsibleTextSkeleton lines={3} />
        </Stack>
        <Stack gap={8}>
          <TextSkeleton fz="h5" lh="h5" w={250} />
          <CollapsibleGroupSkeleton groupHeight={46} gap={6} />
        </Stack>
        <TitleMatchesSkeleton />
        <TitleInfoSkeleton />
      </Stack>
    </>
  );
}

export default TitleContentSkeleton;
