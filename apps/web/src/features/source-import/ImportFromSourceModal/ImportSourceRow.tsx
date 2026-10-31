import { Group, Radio, Text } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { PRIMARY_COLOR, getMutedBackground } from '@/shared/lib/palette';

type Props = {
  source: Source;
  isSelected: boolean;
};

/** Доступный для импорта источник: радио во всю ширину строки. */
function ImportSourceRow({ source, isSelected }: Props) {
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
        <Group gap="md" wrap="nowrap" flex={1} miw={0}>
          <SourceIcon id={source.id} title={source.title} size={28} />
          <Text fz="sm" lh="tight" truncate>
            {source.title}
          </Text>
        </Group>
        <Radio.Indicator variant="outline" />
      </Group>
    </Radio.Card>
  );
}

export default ImportSourceRow;
