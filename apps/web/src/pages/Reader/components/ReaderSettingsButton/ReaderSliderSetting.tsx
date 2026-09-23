import { Flex, Radio, SimpleGrid, Slider, Text } from '@mantine/core';
import { useState, type ReactNode } from 'react';
import ReaderSetting from './ReaderSetting';

type Props = {
  label: string;
  /** Единица для счётчика справа от заголовка: «px», «%». */
  unit: string;
  value: number;
  min: number;
  max: number;
  presets: { id: string; label: string; value: number }[];
  /** Схема под ползунком, если по одному числу непонятно, что настройка делает. */
  preview?: ReactNode;
  onChange: (value: number) => void;
  onChangeEnd: (value: number) => void;
};

/**
 * Числовая настройка: ползунок плюс быстрые пресеты. onChange зовётся на каждое движение — им
 * настройка применяется на лету, а onChangeEnd один раз по отпусканию — им она сохраняется,
 * чтобы не слать запрос на каждый пиксель перетаскивания.
 */
function ReaderSliderSetting({
  label,
  unit,
  value,
  min,
  max,
  presets,
  preview,
  onChange,
  onChangeEnd,
}: Props) {
  const [renderedValue, setRenderedValue] = useState(value);
  const [current, setCurrent] = useState(value);

  // Подхватывает значение с сервера (или откат после неудачного сохранения) без эффекта — по
  // правилу "adjusting state when a prop changes": сравнение и setState идут прямо в теле рендера.
  if (value !== renderedValue) {
    setRenderedValue(value);
    setCurrent(value);
  }

  const activePresetId = presets.find((preset) => preset.value === current)?.id ?? '';

  const applyPreset = (presetId: string) => {
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    setCurrent(preset.value);
    onChange(preset.value);
    onChangeEnd(preset.value);
  };

  const handleSliderChange = (next: number) => {
    setCurrent(next);
    onChange(next);
  };

  return (
    <ReaderSetting
      label={label}
      right={
        <Text lh={1} ff="monospace" c="var(--mantine-primary-color-filled)">
          {current} {unit}
        </Text>
      }
    >
      <Slider
        min={min}
        max={max}
        value={current}
        onChange={handleSliderChange}
        onChangeEnd={onChangeEnd}
        label={null}
      />
      {preview}
      <Radio.Group value={activePresetId} onChange={applyPreset}>
        <SimpleGrid cols={3} spacing={8}>
          {presets.map((preset) => (
            <Radio.Card key={preset.id} value={preset.id} variant="tile" px="xs" py={6}>
              <Flex gap="xs" align="center">
                <Radio.Indicator variant="outline" size="xs" />
                <Text>{preset.label}</Text>
              </Flex>
            </Radio.Card>
          ))}
        </SimpleGrid>
      </Radio.Group>
    </ReaderSetting>
  );
}

export default ReaderSliderSetting;
