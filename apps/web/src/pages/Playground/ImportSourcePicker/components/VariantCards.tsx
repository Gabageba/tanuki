import { Button, Group, Paper, Radio, Stack, Text } from '@mantine/core';
import { SignInIcon } from '@phosphor-icons/react';
import type { SourceId } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { PRIMARY_COLOR, getMutedBackground } from '@/shared/lib/palette';
import { isImportAvailable } from '../lib';
import { DEMO_IMPORT_SOURCES, type DemoImportSource, type VariantProps } from '../models';
import SourceAccountLine from './SourceAccountLine';

/** C1 — карточка на источник: кликабельна целиком, выбранная обведена и подкрашена. */
function VariantCards({ sourceId, onChange }: VariantProps) {
  const renderContent = (source: DemoImportSource) => (
    <Group gap="sm" wrap="nowrap" flex={1} miw={0}>
      <SourceIcon id={source.id} title={source.title} size={32} />
      <Stack gap={4} miw={0}>
        <Text fz="sm" lh={1}>
          {source.title}
        </Text>
        <SourceAccountLine source={source} />
      </Stack>
    </Group>
  );

  return (
    <Radio.Group value={sourceId} onChange={(value) => onChange(value as SourceId)}>
      <Stack gap="xs">
        {DEMO_IMPORT_SOURCES.map((source) => {
          const isSelected = source.id === sourceId;

          // Недоступный источник — не радио-карточка, а такая же рамка с кнопкой входа.
          if (!isImportAvailable(source)) {
            return (
              <Paper key={source.id} withBorder radius="md" px="sm" py="xs">
                <Group justify="space-between" wrap="nowrap">
                  {renderContent(source)}
                  <Button variant="subtle" size="xs" leftSection={<SignInIcon />}>
                    Войти
                  </Button>
                </Group>
              </Paper>
            );
          }

          return (
            <Radio.Card
              key={source.id}
              value={source.id}
              radius="md"
              px="sm"
              py="xs"
              bg={isSelected ? getMutedBackground(PRIMARY_COLOR, true) : undefined}
              style={
                isSelected ? { borderColor: 'var(--mantine-primary-color-filled)' } : undefined
              }
            >
              <Group justify="space-between" wrap="nowrap">
                {renderContent(source)}
                <Radio.Indicator />
              </Group>
            </Radio.Card>
          );
        })}
      </Stack>
    </Radio.Group>
  );
}

export default VariantCards;
