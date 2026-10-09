import { Divider, Group, Paper, Stack, Text } from '@mantine/core';
import type { MissedGroup } from '../models';
import MissedRow from './MissedRow';
import RetryButton from './RetryButton';

type Props = {
  missed: MissedGroup[];
};

/** N4 — мини-список: строка на источник, причина справа, «Повторить» в шапке блока. */
function MissedList({ missed }: Props) {
  return (
    <Paper withBorder radius="md">
      <Group justify="space-between" px="md" py="xs" wrap="nowrap">
        <Text fz="sm" fw={500}>
          Не ответили
        </Text>
        <RetryButton />
      </Group>
      <Divider />
      <Stack gap={0}>
        {missed.map((group, index) => (
          <Stack key={group.source.id} gap={0}>
            {index > 0 && <Divider />}
            <MissedRow group={group} />
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

export default MissedList;
