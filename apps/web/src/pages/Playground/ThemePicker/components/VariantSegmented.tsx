import { Group, SegmentedControl, Text } from '@mantine/core';
import { getColorSchemeIcon } from '@/shared/lib/colorScheme';
import GroupedList from '@/shared/ui/GroupedList';
import { getSchemeHint, getSchemeLabel } from '../lib';
import { SCHEMES, type VariantProps } from '../models';
import SchemePreview from './SchemePreview';

type Props = VariantProps;

/** T4 — одно превью на всю настройку: показывает выбранную схему, выбор — сегментами. */
function VariantSegmented({ value, onChange, narrow }: Props) {
  return (
    <GroupedList label="Оформление">
      <GroupedList.Row
        icon={
          <SchemePreview
            scheme={value}
            w={52}
            h={36}
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: 'var(--mantine-radius-sm)',
            }}
          />
        }
        title="Тема оформления"
        description={getSchemeHint(value)}
        action={
          <SegmentedControl
            value={value}
            onChange={(next) => {
              const scheme = SCHEMES.find((item) => item === next);
              if (scheme) onChange(scheme);
            }}
            fullWidth={narrow}
            w={narrow ? '100%' : undefined}
            data={SCHEMES.map((scheme) => ({
              value: scheme,
              label: (
                <Group gap={6} wrap="nowrap" justify="center">
                  {getColorSchemeIcon(scheme)}
                  <Text fz="sm" inherit>
                    {getSchemeLabel(scheme)}
                  </Text>
                </Group>
              ),
            }))}
          />
        }
      />
    </GroupedList>
  );
}

export default VariantSegmented;
