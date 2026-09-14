import { Box, Group, Scroller, Skeleton, Stack } from '@mantine/core';
import MangaCardSkeleton from '@/entities/manga/card/MangaCardSkeleton';
import { VIEW_MODE } from '@/shared/lib/viewMode';

function MangaMatchesSkeleton() {
  return (
    <Stack gap={8}>
      <Group gap={8} justify="space-between">
        <Skeleton h={16} w={250} />
        <Skeleton w={157.13} h={30} />
      </Group>

      <Scroller flex={1} styles={{ control: { zIndex: 2 } }}>
        <Group wrap="nowrap" align="stretch" gap="xs">
          <Stack gap={6}>
            <Group wrap="nowrap" gap="xs">
              <Skeleton
                w={168.2}
                h={14}
                my={5.4}
                pos="sticky"
                left={0}
                bg="var(--mantine-color-body)"
                style={{ zIndex: 3 }}
              />
            </Group>
            <Group wrap="nowrap" h="100%" align="stretch" gap="xs">
              {Array.from({ length: 6 }).map((_, index) => (
                <Box key={index} w={170}>
                  <MangaCardSkeleton viewMode={VIEW_MODE.GRID} />
                </Box>
              ))}
            </Group>
          </Stack>
        </Group>
      </Scroller>
    </Stack>
  );
}

export default MangaMatchesSkeleton;
