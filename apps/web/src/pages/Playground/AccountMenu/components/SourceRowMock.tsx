import { Group, Stack, Text } from '@mantine/core';
import type { SourceId } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';

type Props = {
  id: SourceId;
  title: string;
  domain: string;
};

/** Строка источника в списке выбора — упрощённая, для контекста. */
function SourceRowMock({ id, title, domain }: Props) {
  return (
    <Group gap="sm" wrap="nowrap" px="sm" py={8}>
      <SourceIcon id={id} title={title} size={28} />
      <Stack gap={0} miw={0}>
        <Text fz="sm" lh="tight" truncate>
          {title}
        </Text>
        <Text fz={11} ff="monospace" c="dimmed" lh="tight" truncate>
          {domain}
        </Text>
      </Stack>
    </Group>
  );
}

export default SourceRowMock;
