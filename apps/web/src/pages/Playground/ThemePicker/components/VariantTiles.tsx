import { Group, Radio, SimpleGrid, Text } from '@mantine/core';
import { getColorSchemeIcon } from '@/shared/lib/colorScheme';
import { getSchemeLabel, getSelectionBorderColor } from '../lib';
import { SCHEMES } from '../models';
import type { VariantProps } from '../models';
import SchemePreview from './SchemePreview';

type Props = VariantProps;

/** T1 — плитки фиксированного размера: не тянутся на ширину страницы, три в ряд и на телефоне. */
function VariantTiles({ value, onChange }: Props) {
  return (
    <SimpleGrid cols={3} spacing="xs" maw={420}>
      {SCHEMES.map((scheme) => (
        <Radio.Card
          key={scheme}
          checked={scheme === value}
          onClick={() => onChange(scheme)}
          radius="md"
          p={6}
          style={{ borderColor: getSelectionBorderColor(scheme === value) }}
        >
          <SchemePreview
            scheme={scheme}
            style={{ aspectRatio: '16 / 10', borderRadius: 'var(--mantine-radius-sm)' }}
          />
          <Group
            gap={6}
            justify="center"
            wrap="nowrap"
            mt={6}
            c={scheme === value ? undefined : 'dimmed'}
          >
            {getColorSchemeIcon(scheme)}
            <Text fz="sm" fw={scheme === value ? 600 : 400} truncate>
              {getSchemeLabel(scheme)}
            </Text>
          </Group>
        </Radio.Card>
      ))}
    </SimpleGrid>
  );
}

export default VariantTiles;
