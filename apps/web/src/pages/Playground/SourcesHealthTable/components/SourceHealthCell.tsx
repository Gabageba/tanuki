import { Group, Stack, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import type { MockSource } from '../models';

type Props = {
  source: MockSource;
};

/** Иконка, название и домен второй строкой — как аватар, имя и почта у пользователя. */
function SourceHealthCell({ source }: Props) {
  return (
    <Group gap="sm" wrap="nowrap" miw={0}>
      <SourceIcon id={source.id} title={source.title} size={32} />
      <Stack gap={0} miw={0}>
        <Text fz="sm" fw={500} truncate>
          {source.title}
        </Text>
        <Text fz="xs" c="dimmed" ff="monospace" truncate>
          {source.domain}
        </Text>
      </Stack>
    </Group>
  );
}

export default SourceHealthCell;
