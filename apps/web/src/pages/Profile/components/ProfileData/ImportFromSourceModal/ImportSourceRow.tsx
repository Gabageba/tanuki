import { Group, Radio, Text } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { PRIMARY_COLOR, getMutedBackground } from '@/shared/lib/palette';

type Props = {
  source: Source;
  isSelected: boolean;
};

/** Источник внутри рамки сети: со входом — радио во всю ширину строки, без входа — приглушён. */
function ImportSourceRow({ source, isSelected }: Props) {
  const content = (
    <Group gap="md" wrap="nowrap" flex={1} miw={0}>
      <SourceIcon
        id={source.id}
        title={source.title}
        size={28}
        opacity={source.isLoggedIn ? 1 : 0.5}
      />
      <Text fz="sm" lh={1} c={source.isLoggedIn ? undefined : 'dimmed'} truncate>
        {source.title}
      </Text>
    </Group>
  );

  if (!source.isLoggedIn) {
    return (
      <Group px="md" py="xs" wrap="nowrap">
        {content}
      </Group>
    );
  }

  return (
    <Radio.Card
      value={source.id}
      withBorder={false}
      radius={0}
      px="md"
      py="xs"
      bg={isSelected ? getMutedBackground(PRIMARY_COLOR, true) : undefined}
    >
      <Group justify="space-between" wrap="nowrap">
        {content}
        <Radio.Indicator variant="outline" />
      </Group>
    </Radio.Card>
  );
}

export default ImportSourceRow;
