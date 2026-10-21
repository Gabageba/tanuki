import { Box, Group, Scroller, Skeleton, Stack } from '@mantine/core';
import { isStaffRole } from '@tanuki/contracts';
import TitleCardSkeleton from '@/entities/title/card/TitleCardSkeleton';
import { VIEW_MODE } from '@/shared/lib/viewMode';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';

function TitleMatchesSkeleton() {
  const { data: user } = useCurrentUser();
  // «Добавить вручную» видят только сотрудники — у остальных под неё места не держим.
  const isStaff = isStaffRole(user?.role);

  return (
    <Stack gap={8}>
      <Group gap={8} justify="space-between">
        <TextSkeleton fz="h5" lh="h5" w={250} />
        {isStaff && <Skeleton w={{ base: '100%', xs: 157.13 }} h={30} />}
      </Group>

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
                  <TitleCardSkeleton viewMode={VIEW_MODE.GRID} />
                </Box>
              ))}
            </Group>
          </Stack>
        </Group>
      </Scroller>
    </Stack>
  );
}

export default TitleMatchesSkeleton;
