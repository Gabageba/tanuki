import { Avatar, Group, Stack, Title } from '@mantine/core';
import PageLayout from '@/shared/ui/PageLayout';
import type { CurrentUserQuery } from '../models';
import MidDotGroup from '@/shared/ui/MidDotGroup';

function ProfileInfo() {
  const { data } = PageLayout.useQuery<CurrentUserQuery>();

  return (
    <Stack>
      <Group>
        <Avatar src="" variant="outline" color="terracotta" name={data?.username} size="xl" />
        <Stack gap="xs">
          <Title order={2} lh={1}>
            {data?.username}
          </Title>
          <MidDotGroup
            lh={1}
            text={{ fz: 12, c: 'dimmed' }}
            items={['в Tanuki с марта 2024', '892 дня']}
          />
        </Stack>
      </Group>
    </Stack>
  );
}

export default ProfileInfo;
