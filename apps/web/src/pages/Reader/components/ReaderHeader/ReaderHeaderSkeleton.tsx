import { AppShell, Group, Skeleton, Stack } from '@mantine/core';
import { TITLE_NAME_MIN_WIDTH } from '../../lib';
import ReaderControlsSkeleton from '../ReaderControls/ReaderControlsSkeleton';

function ReaderHeaderSkeleton() {
  return (
    <AppShell.Header>
      <Group px="md" h="100%" gap="md" wrap="nowrap">
        <Group gap="xs" flex={1} miw={TITLE_NAME_MIN_WIDTH} wrap="nowrap">
          <Skeleton w={26} h={26} />
          <Stack gap={4} miw={0}>
            <Skeleton w={TITLE_NAME_MIN_WIDTH} h={16} />
            <Skeleton w={TITLE_NAME_MIN_WIDTH} h={12} />
          </Stack>
        </Group>
        <Skeleton w={50} h={12} hiddenFrom="md" />
        <ReaderControlsSkeleton visibleFrom="md" />
      </Group>
    </AppShell.Header>
  );
}

export default ReaderHeaderSkeleton;
