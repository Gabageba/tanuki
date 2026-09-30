import { Group, Radio, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ColorScheme } from '@tanuki/contracts';
import { getColorSchemeLabel } from '@/shared/lib/colorScheme';
import { PRIMARY_COLOR, getMutedBackground } from '@/shared/lib/palette';
import ColorSchemePreview from './ColorSchemePreview';
import { getColorSchemeHint } from './lib';

type Props = {
  colorScheme: ColorScheme;
  isSelected: boolean;
  onSelect: (colorScheme: ColorScheme) => void;
};

/** Схема строкой GroupedList: миниатюра на месте иконки, радио во всю ширину строки. */
function ColorSchemeRow({ colorScheme, isSelected, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <Radio.Card
      checked={isSelected}
      onClick={() => onSelect(colorScheme)}
      withBorder={false}
      radius={0}
      px="md"
      py="xs"
      bg={isSelected ? getMutedBackground(PRIMARY_COLOR, true) : undefined}
    >
      <Group justify="space-between" gap="md" wrap="nowrap">
        <Group gap="md" wrap="nowrap" flex={1} miw={0}>
          <ColorSchemePreview colorScheme={colorScheme} />
          <Stack gap={4} miw={0}>
            <Text lh={1} fz={14}>
              {getColorSchemeLabel(colorScheme, t)}
            </Text>
            <Text fz={12} c="dimmed" lh={1.2}>
              {getColorSchemeHint(colorScheme, t)}
            </Text>
          </Stack>
        </Group>
        <Radio.Indicator variant="outline" />
      </Group>
    </Radio.Card>
  );
}

export default ColorSchemeRow;
