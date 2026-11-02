import { Flex, Radio, SimpleGrid, Slider, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import GroupedList from '@/shared/ui/GroupedList';

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  unit: string;
  value: number;
  range: { MIN: number; MAX: number };
  presets: { label: string; value: number }[];
  onChange: (value: number) => void;
  disabled?: boolean;
  preview?: ReactNode;
};
function SettingsSlider({
  icon,
  title,
  description,
  unit,
  value,
  range,
  presets,
  onChange,
  disabled = false,
  preview,
}: Props) {
  return (
    <GroupedList.Row
      icon={icon}
      title={title}
      description={description}
      disabled={disabled}
      isActionCompact
      action={
        <Text lh="tight" fz="sm" ff="monospace" c="var(--mantine-primary-color-filled)">
          {value}
          {unit && ` ${unit}`}
        </Text>
      }
    >
      <Slider
        aria-label={title}
        min={range.MIN}
        max={range.MAX}
        value={value}
        onChange={onChange}
        label={null}
        disabled={disabled}
      />
      {preview}
      <Radio.Group
        value={String(value)}
        onChange={(next) => onChange(Number(next))}
        aria-label={title}
      >
        <SimpleGrid cols={3} spacing={8}>
          {presets.map((preset) => (
            <Radio.Card
              key={preset.value}
              value={String(preset.value)}
              variant="tile"
              px="xs"
              py={6}
              disabled={disabled}
            >
              <Flex gap="xs" align="center" justify={{ base: 'center', xs: 'flex-start' }}>
                <Radio.Indicator variant="outline" size="xs" visibleFrom="xs" />
                <Text fz="sm">{preset.label}</Text>
              </Flex>
            </Radio.Card>
          ))}
        </SimpleGrid>
      </Radio.Group>
    </GroupedList.Row>
  );
}
export default SettingsSlider;
