import { Group, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';

/** Размер `Avatar size="xl"` у Mantine. */
const AVATAR_SIZE = 84;

/** Загрузка шапки профиля: аватар, имя и строка «в Tanuki с …» — плашками того же размера. */
function ProfileInfoSkeleton() {
  return (
    <Stack>
      <Group wrap="nowrap" align="flex-start">
        <Skeleton w={AVATAR_SIZE} h={AVATAR_SIZE} radius="md" flex="none" />
        <Stack gap={4} flex={1} miw={0}>
          <TextSkeleton fz="h2" lh={1.3} w={180} />
          <TextSkeleton fz={12} lh="tight" w={200} />
        </Stack>
      </Group>
    </Stack>
  );
}

export default ProfileInfoSkeleton;
