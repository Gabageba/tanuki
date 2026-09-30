import { Group, Radio, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { PRIMARY_COLOR, getMutedBackground } from '@/shared/lib/palette';
import { isImportAvailable } from '../lib';
import type { DemoImportSource } from '../models';

type Props = {
  source: DemoImportSource;
  isSelected: boolean;
};

/** Строка источника внутри рамки сети: доступная — радио во всю ширину, недоступная — приглушена. */
function SourceRow({ source, isSelected }: Props) {
  const isAvailable = isImportAvailable(source);
  const content = (
    <Group gap="md" wrap="nowrap" flex={1} miw={0}>
      <SourceIcon id={source.id} title={source.title} size={28} opacity={isAvailable ? 1 : 0.5} />
      <Text fz="sm" lh={1} c={isAvailable ? undefined : 'dimmed'} truncate>
        {source.title}
      </Text>
    </Group>
  );

  if (!isAvailable) {
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
        <Radio.Indicator />
      </Group>
    </Radio.Card>
  );
}

export default SourceRow;
