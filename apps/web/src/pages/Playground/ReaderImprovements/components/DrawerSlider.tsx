import { Flex, Group, Radio, SimpleGrid, Slider, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  presets: { label: string; value: number }[];
  preview?: ReactNode;
};
function DrawerSlider({ label, unit, value, min, max, onChange, presets, preview }: Props) {
  return (
    <Stack gap={8}>
      <Group justify="space-between" wrap="nowrap">
        <Text c="dimmed">{label}</Text>
        <Text ff="monospace" c="var(--mantine-primary-color-filled)">
          {value}
          {unit && ` ${unit}`}
        </Text>
      </Group>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        label={null}
      />
      {preview}
      <Radio.Group
        value={String(value)}
        onChange={(next) => onChange(Number(next))}
        aria-label={label}
      >
        <SimpleGrid cols={3} spacing={8}>
          {presets.map((preset) => (
            <Radio.Card
              key={preset.value}
              value={String(preset.value)}
              variant="tile"
              px="xs"
              py={6}
            >
              <Flex gap="xs" align="center">
                <Radio.Indicator variant="outline" size="xs" />
                <Text>{preset.label}</Text>
              </Flex>
            </Radio.Card>
          ))}
        </SimpleGrid>
      </Radio.Group>
    </Stack>
  );
}
export default DrawerSlider;
