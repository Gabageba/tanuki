import type { ReactNode } from 'react';
import {
  Chip,
  Flex,
  Group,
  NumberInput,
  Radio,
  SegmentedControl,
  SimpleGrid,
  Slider,
  Text,
} from '@mantine/core';
import { NUMBER_CONTROL, type NumberControl, type NumberPreset } from '../models';
import SettingRow from './SettingRow';

type Props = {
  control: NumberControl;
  icon: ReactNode;
  title: string;
  description: string;
  /** Единица: «px», «%». */
  unit: string;
  value: number;
  min: number;
  max: number;
  presets: NumberPreset[];
  /** Схема под настройкой, если по одному числу непонятно, что она делает. */
  preview?: ReactNode;
  onChange: (value: number) => void;
  disabled: boolean;
  /** Почему не действует — заменяет описание (D1). */
  disabledDescription?: string;
  /** Почему не действует — в подсказке при наведении (D3). */
  disabledTooltip?: string;
  narrow: boolean;
};

/** Числовая настройка одним из способов оси S: ползунок, пресеты, поле ввода. */
function NumberSetting({
  control,
  icon,
  title,
  description,
  unit,
  value,
  min,
  max,
  presets,
  preview,
  onChange,
  disabled,
  disabledDescription,
  disabledTooltip,
  narrow,
}: Props) {
  const activePreset = presets.find((preset) => preset.value === value);
  const shownDescription = disabled && disabledDescription ? disabledDescription : description;

  const readout = (
    <Text lh="tight" fz={14} ff="monospace" c="var(--mantine-primary-color-filled)">
      {value}&nbsp;{unit}
    </Text>
  );

  const slider = (
    <Slider
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      label={null}
      disabled={disabled}
    />
  );

  const rowProps = {
    icon,
    title,
    disabled,
    tooltip: disabledTooltip,
    narrow,
  };

  switch (control) {
    case NUMBER_CONTROL.DRAWER:
    case NUMBER_CONTROL.DRAWER_DESCRIBED:
      return (
        <SettingRow
          {...rowProps}
          description={
            control === NUMBER_CONTROL.DRAWER_DESCRIBED
              ? shownDescription
              : disabled
                ? disabledDescription
                : undefined
          }
          action={readout}
        >
          {slider}
          {preview}
          <Radio.Group
            value={activePreset ? String(activePreset.value) : ''}
            onChange={(next) => onChange(Number(next))}
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
                  <Flex gap="xs" align="center">
                    <Radio.Indicator variant="outline" size="xs" />
                    <Text fz="sm">{preset.label}</Text>
                  </Flex>
                </Radio.Card>
              ))}
            </SimpleGrid>
          </Radio.Group>
        </SettingRow>
      );
    case NUMBER_CONTROL.SLIDER:
      return (
        <SettingRow {...rowProps} description={shownDescription} action={readout}>
          {slider}
          {preview}
        </SettingRow>
      );
    case NUMBER_CONTROL.PRESETS:
      return (
        <SettingRow
          {...rowProps}
          description={
            !disabled && !activePreset ? (
              <>
                Своё значение:{' '}
                <Text span inherit ff="monospace">
                  {value}&nbsp;{unit}
                </Text>
              </>
            ) : (
              shownDescription
            )
          }
          isActionWide
          action={
            <SegmentedControl
              fullWidth={narrow}
              size="xs"
              value={activePreset ? String(activePreset.value) : ''}
              onChange={(next) => onChange(Number(next))}
              data={presets.map((preset) => ({ value: String(preset.value), label: preset.label }))}
              disabled={disabled}
            />
          }
        >
          {preview}
        </SettingRow>
      );
    case NUMBER_CONTROL.INPUT:
      return (
        <SettingRow
          {...rowProps}
          description={shownDescription}
          action={
            <NumberInput
              w={narrow ? 112 : 128}
              size="xs"
              value={value}
              min={min}
              max={max}
              clampBehavior="strict"
              suffix={` ${unit}`}
              leftSection={icon}
              onChange={(next) => typeof next === 'number' && onChange(next)}
              disabled={disabled}
              styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
            />
          }
        >
          <Chip.Group
            value={activePreset ? String(activePreset.value) : ''}
            onChange={(next) => onChange(Number(next))}
          >
            <Group gap={6}>
              {presets.map((preset) => (
                <Chip
                  key={preset.value}
                  value={String(preset.value)}
                  size="xs"
                  variant="outline"
                  disabled={disabled}
                >
                  {preset.label}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
          {preview}
        </SettingRow>
      );
  }
}

export default NumberSetting;
