import type { ReactNode } from 'react';
import { Group, Paper, Radio, Stack, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { PRIMARY_COLOR, getMutedBackground } from '@/shared/lib/palette';
import { isImportAvailable } from '../lib';
import type { DemoImportSource } from '../models';

type Props = {
  source: DemoImportSource;
  isSelected: boolean;
  description?: ReactNode;
  /** Стоит на месте радио у источника, который выбрать нельзя. */
  action?: ReactNode;
};

/** Карточка источника внутри Radio.Group: доступная — радио-карточка, недоступная — приглушённая рамка. */
function SourceCard({ source, isSelected, description, action }: Props) {
  const isAvailable = isImportAvailable(source);
  const content = (
    <Group gap="sm" wrap="nowrap" flex={1} miw={0}>
      <SourceIcon id={source.id} title={source.title} size={32} opacity={isAvailable ? 1 : 0.5} />
      <Stack gap={4} miw={0}>
        <Text fz="sm" lh={1} c={isAvailable ? undefined : 'dimmed'}>
          {source.title}
        </Text>
        {description}
      </Stack>
    </Group>
  );

  if (!isAvailable) {
    return (
      <Paper withBorder radius="md" px="sm" py="xs">
        <Group justify="space-between" wrap="nowrap">
          {content}
          {action}
        </Group>
      </Paper>
    );
  }

  return (
    <Radio.Card
      value={source.id}
      radius="md"
      px="sm"
      py="xs"
      bg={isSelected ? getMutedBackground(PRIMARY_COLOR, true) : undefined}
      style={isSelected ? { borderColor: 'var(--mantine-primary-color-filled)' } : undefined}
    >
      <Group justify="space-between" wrap="nowrap">
        {content}
        <Radio.Indicator />
      </Group>
    </Radio.Card>
  );
}

export default SourceCard;
