import { Group, Radio, SimpleGrid, Stack, Text } from '@mantine/core';
import { getSchemeHint, getSchemeLabel, getSelectionBorderColor } from '../lib';
import { SCHEMES, type VariantProps } from '../models';
import SchemePreview from './SchemePreview';

type Props = VariantProps;

/** T0 — как в макете: три карточки на всю ширину, превью сверху, подпись и отметка снизу. */
function VariantCurrent({ value, onChange, narrow }: Props) {
  return (
    <SimpleGrid cols={narrow ? 1 : 3}>
      {SCHEMES.map((scheme) => (
        <Radio.Card
          key={scheme}
          checked={scheme === value}
          onClick={() => onChange(scheme)}
          radius="md"
          style={{ overflow: 'hidden', borderColor: getSelectionBorderColor(scheme === value) }}
        >
          <SchemePreview scheme={scheme} h={132} />
          <Group justify="space-between" wrap="nowrap" p="md">
            <Stack gap={2}>
              <Text fw={600}>{getSchemeLabel(scheme)}</Text>
              <Text fz="sm" c="dimmed">
                {getSchemeHint(scheme)}
              </Text>
            </Stack>
            <Radio.Indicator />
          </Group>
        </Radio.Card>
      ))}
    </SimpleGrid>
  );
}

export default VariantCurrent;
