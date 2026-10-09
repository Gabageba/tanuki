import {
  Divider,
  Flex,
  Group,
  NumberInput,
  Radio,
  RangeSlider,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import Mdash from '@/shared/ui/Mdash';
import { getRangeSelection, setRangeSelection } from './lib/filterSelection';
import RangeFilterPresetCard from './RangeFilterPresetCard';

type Props = {
  group: FilterGroup;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
};

function RangeFilterGroup({ group, selection, onChange }: Props) {
  const { t } = useTranslation();

  if (!group.settings) {
    return null;
  }

  const { range, presets } = group.settings;
  const current = getRangeSelection(selection, group.id);
  const allowDecimal = !Number.isInteger(range.step ?? 1);

  const activePresetId =
    presets?.find((preset) => preset.min === current?.min && preset.max === current?.max)?.id ??
    (current ? null : 'any');

  const handleRangeChange = (next: { min?: number; max?: number }) => {
    const isFullRange = next.min === range.min && next.max === range.max;
    onChange(
      setRangeSelection(
        selection,
        group.id,
        isFullRange ? { min: undefined, max: undefined } : next,
      ),
    );
  };

  return (
    <Flex gap="md" flex={1} direction={{ base: 'column', md: 'row' }}>
      <Stack flex={{ base: 'none', md: 1 }}>
        <Group>
          <NumberInput
            flex={1}
            allowNegative={false}
            allowDecimal={allowDecimal}
            leftSection={<Text fz={12}>{t('from')}</Text>}
            hideControls
            min={range.min}
            max={range.max}
            step={range.step}
            placeholder={`${range.min}`}
            value={current?.min ?? ''}
            onChange={(value) =>
              handleRangeChange({
                min: value === '' ? undefined : Number(value),
                max: current?.max,
              })
            }
          />
          <Mdash />
          <NumberInput
            flex={1}
            allowNegative={false}
            allowDecimal={allowDecimal}
            leftSection={<Text fz={12}>{t('to')}</Text>}
            hideControls
            min={range.min}
            max={range.max}
            step={range.step}
            placeholder={`${range.max}`}
            value={current?.max ?? ''}
            onChange={(value) =>
              handleRangeChange({
                min: current?.min,
                max: value === '' ? undefined : Number(value),
              })
            }
          />
        </Group>
        <RangeSlider
          min={range.min}
          max={range.max}
          minRange={0}
          step={range.step}
          value={[current?.min ?? range.min, current?.max ?? range.max]}
          onChange={([nextMin, nextMax]) => handleRangeChange({ min: nextMin, max: nextMax })}
        />
      </Stack>
      {!!presets?.length && (
        <>
          <Divider hiddenFrom="md" />
          <Divider orientation="vertical" visibleFrom="md" />
          <Radio.Group
            flex={1}
            value={activePresetId}
            onChange={(presetId) => {
              if (presetId === 'any') {
                handleRangeChange({ min: undefined, max: undefined });
                return;
              }
              const preset = presets.find((p) => p.id === presetId);
              if (preset) {
                handleRangeChange({ min: preset.min, max: preset.max });
              }
            }}
          >
            <SimpleGrid cols={{ base: 1, xxs: 2, sm: 3, md: 2 }} spacing={8}>
              <RangeFilterPresetCard id="any" label={t('any')} />
              {presets.map((preset) => (
                <RangeFilterPresetCard key={preset.id} label={preset.label} id={preset.id} />
              ))}
            </SimpleGrid>
          </Radio.Group>
        </>
      )}
    </Flex>
  );
}

export default RangeFilterGroup;
