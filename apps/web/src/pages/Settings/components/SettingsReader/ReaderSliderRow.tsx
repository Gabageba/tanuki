import { useState, type ReactNode } from 'react';
import { Flex, Radio, SimpleGrid, Slider, Text } from '@mantine/core';
import GroupedList from '@/shared/ui/GroupedList';
import type { ReaderPreset, ReaderRange } from './models';

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  /** Единица для значения справа: «px», «%». */
  unit: string;
  value: number;
  range: ReaderRange;
  presets: ReaderPreset[];
  /** Схема под ползунком, если по одному числу непонятно, что настройка делает. */
  preview?: ReactNode;
  onChange: (value: number) => void;
  disabled: boolean;
};

/**
 * Числовая настройка строкой GroupedList: значение справа, под заголовком ползунок и пресеты.
 * Пока ползунок тянут, значение живёт локально, а сохраняется один раз — по отпусканию, чтобы не
 * слать запрос на каждый пиксель.
 */
function ReaderSliderRow({
  icon,
  title,
  description,
  unit,
  value,
  range,
  presets,
  preview,
  onChange,
  disabled,
}: Props) {
  const [renderedValue, setRenderedValue] = useState(value);
  const [current, setCurrent] = useState(value);

  // Подхватывает значение с сервера (или откат после неудачного сохранения) без эффекта — по
  // правилу "adjusting state when a prop changes".
  if (value !== renderedValue) {
    setRenderedValue(value);
    setCurrent(value);
  }

  const activePreset = presets.find((preset) => preset.value === current);

  const applyPreset = (next: string) => {
    const preset = presets.find((item) => String(item.value) === next);
    if (!preset) return;
    setCurrent(preset.value);
    onChange(preset.value);
  };

  return (
    <GroupedList.Row
      icon={icon}
      title={title}
      description={description}
      disabled={disabled}
      isActionCompact
      action={
        <Text lh="tight" fz={14} ff="monospace" c="var(--mantine-primary-color-filled)">
          {current}&nbsp;{unit}
        </Text>
      }
    >
      <Slider
        aria-label={title}
        min={range.MIN}
        max={range.MAX}
        value={current}
        onChange={setCurrent}
        onChangeEnd={onChange}
        label={null}
        disabled={disabled}
      />
      {preview}
      <Radio.Group
        aria-label={title}
        value={activePreset ? String(activePreset.value) : ''}
        onChange={applyPreset}
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
                <Text fz="sm" ff={/^\d/.test(preset.label) ? 'monospace' : undefined}>
                  {preset.label}
                </Text>
              </Flex>
            </Radio.Card>
          ))}
        </SimpleGrid>
      </Radio.Group>
    </GroupedList.Row>
  );
}

export default ReaderSliderRow;
