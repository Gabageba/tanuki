import { Box, Group, Scroller, Stack } from '@mantine/core';
import SourceTitleCardSkeleton from '@/entities/source/components/SourceTitleCard/SourceTitleCardSkeleton';
import { VIEW_MODE } from '@/shared/lib/viewMode';
import TextSkeleton from '@/shared/ui/TextSkeleton';

function TitleMatchesSkeleton() {
  return (
    <Scroller flex={1} styles={{ control: { zIndex: 2 } }}>
      <Group wrap="nowrap" align="stretch" gap="xs">
        <Stack gap={6}>
          <Group
            wrap="nowrap"
            gap="xs"
            pos="sticky"
            left={0}
            bg="var(--mantine-color-body)"
            style={{ zIndex: 3 }}
          >
            <TextSkeleton w={168.2} />
          </Group>
          <Group wrap="nowrap" h="100%" align="stretch" gap="xs">
            {Array.from({ length: 6 }).map((_, index) => (
              <Box key={index} w={170}>
                <SourceTitleCardSkeleton viewMode={VIEW_MODE.GRID} />
              </Box>
            ))}
          </Group>
        </Stack>
      </Group>
    </Scroller>
  );
}

export default TitleMatchesSkeleton;
