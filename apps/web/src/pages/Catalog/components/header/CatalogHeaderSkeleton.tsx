import { ActionIcon, Group } from '@mantine/core';
import { CaretLeftIcon } from '@phosphor-icons/react';
import SourceTitleSkeleton from '@/entities/source/components/SourceTitle/SourceTitleSkeleton';

function CatalogHeaderSkeleton() {
  return (
    <Group justify="space-between">
      <Group gap="xs">
        <ActionIcon variant="subtle" color="gray" disabled>
          <CaretLeftIcon />
        </ActionIcon>
        <SourceTitleSkeleton />
        {/* <SourceTitle source={source} showStatus /> */}
      </Group>
    </Group>
  );
}

export default CatalogHeaderSkeleton;
