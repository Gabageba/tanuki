import { AppShell, Group, Progress, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { TITLE_NAME_MIN_WIDTH } from '../../lib';
import ReaderControlsSkeleton from '../ReaderControls/ReaderControlsSkeleton';

function ReaderHeaderSkeleton() {
  return (
    <AppShell.Header withBorder={false}>
      <Group px="md" h="100%" gap="md" wrap="nowrap">
        <Group gap="xs" flex={1} miw={TITLE_NAME_MIN_WIDTH} wrap="nowrap">
          <Skeleton w={26} h={26} />
          <Stack gap={4} miw={0}>
            <TextSkeleton fz="h5" lh="tight" w={TITLE_NAME_MIN_WIDTH} />
            <TextSkeleton fz={12} lh="tight" w={TITLE_NAME_MIN_WIDTH} />
          </Stack>
        </Group>
        <TextSkeleton fz={12} w={50} hiddenFrom="md" />
        <ReaderControlsSkeleton visibleFrom="md" />
      </Group>
      <Progress value={0} size={2} radius={0} pos="absolute" bottom={0} left={0} right={0} />
    </AppShell.Header>
  );
}

export default ReaderHeaderSkeleton;
