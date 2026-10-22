import { Flex, Group, Skeleton } from '@mantine/core';
import SourceTitleSkeleton from '@/entities/source/components/SourceTitle/SourceTitleSkeleton';
import PageLayout from '@/shared/ui/PageLayout';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import GoBackButton from '@/shared/ui/GoBackButton';

function CatalogHeaderSkeleton() {
  return (
    <PageLayout.Header>
      <Flex justify="space-between" direction={{ base: 'column', sm: 'row' }} gap="sm">
        <Group gap="xs" wrap="nowrap" miw={0} flex={1}>
          <GoBackButton path={ROUTE_PATHS.SOURCES} />
          <SourceTitleSkeleton />
        </Group>
        <Skeleton h={36} w={{ base: '100%', sm: 300 }} />
      </Flex>
    </PageLayout.Header>
  );
}

export default CatalogHeaderSkeleton;
