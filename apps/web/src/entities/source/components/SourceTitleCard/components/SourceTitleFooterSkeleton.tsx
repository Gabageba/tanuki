import { Group, Skeleton } from '@mantine/core';
import TitleCardTagsSkeleton from './TitleCardTags/TitleCardTagsSkeleton';

function SourceTitleFooterSkeleton() {
  return (
    <Group gap={8} wrap="nowrap">
      <TitleCardTagsSkeleton />
      <Skeleton h={16} w={48} />
    </Group>
  );
}

export default SourceTitleFooterSkeleton;
