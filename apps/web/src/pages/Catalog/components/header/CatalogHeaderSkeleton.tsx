import { ActionIcon, Group } from '@mantine/core';
import { CaretLeftIcon } from '@phosphor-icons/react';
import SourceTitleSkeleton from '@/entities/source/components/SourceTitle/SourceTitleSkeleton';
import PageLayout from '@/shared/ui/PageLayout';

function CatalogHeaderSkeleton() {
  return (
    <PageLayout.Header>
      <Group justify="space-between">
        <Group gap="xs">
          <ActionIcon variant="subtle" color="gray" disabled>
            <CaretLeftIcon />
          </ActionIcon>
          <SourceTitleSkeleton />
        </Group>
      </Group>
    </PageLayout.Header>
  );
}

export default CatalogHeaderSkeleton;
