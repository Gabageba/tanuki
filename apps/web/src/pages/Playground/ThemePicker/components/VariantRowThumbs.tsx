import { Group, Tooltip, UnstyledButton } from '@mantine/core';
import { PaletteIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { getSchemeLabel, getSelectionBorderColor } from '../lib';
import { SCHEMES, type VariantProps } from '../models';
import SchemePreview from './SchemePreview';

type Props = VariantProps;

/** T2 — одна строка настроек: миниатюры вместо контрола, имя выбранной схемы — в пояснении. */
function VariantRowThumbs({ value, onChange }: Props) {
  return (
    <GroupedList label="Оформление">
      <GroupedList.Row
        icon={<PaletteIcon />}
        title="Тема оформления"
        description={getSchemeLabel(value)}
        action={
          <Group gap="xs" wrap="nowrap">
            {SCHEMES.map((scheme) => (
              <Tooltip key={scheme} label={getSchemeLabel(scheme)}>
                <UnstyledButton
                  aria-label={getSchemeLabel(scheme)}
                  aria-pressed={scheme === value}
                  onClick={() => onChange(scheme)}
                  p={2}
                  style={{
                    border: `2px solid ${scheme === value ? getSelectionBorderColor(true) : 'transparent'}`,
                    borderRadius: 'var(--mantine-radius-md)',
                  }}
                >
                  <SchemePreview
                    scheme={scheme}
                    w={56}
                    h={38}
                    style={{
                      border: '1px solid var(--mantine-color-default-border)',
                      borderRadius: 'var(--mantine-radius-sm)',
                    }}
                  />
                </UnstyledButton>
              </Tooltip>
            ))}
          </Group>
        }
      />
    </GroupedList>
  );
}

export default VariantRowThumbs;
