import { Radio } from '@mantine/core';
import GroupedList from '@/shared/ui/GroupedList';
import { getSchemeHint, getSchemeLabel } from '../lib';
import { SCHEMES, type VariantProps } from '../models';
import SchemePreview from './SchemePreview';

type Props = VariantProps;

/** T3 — каждая схема строкой GroupedList: миниатюра на месте иконки, радио справа. */
function VariantRows({ value, onChange }: Props) {
  return (
    <GroupedList label="Тема оформления">
      {SCHEMES.map((scheme) => (
        <GroupedList.Row
          key={scheme}
          icon={
            <SchemePreview
              scheme={scheme}
              w={52}
              h={36}
              style={{
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 'var(--mantine-radius-sm)',
              }}
            />
          }
          title={getSchemeLabel(scheme)}
          description={getSchemeHint(scheme)}
          action={
            <Radio
              aria-label={getSchemeLabel(scheme)}
              checked={scheme === value}
              onChange={() => onChange(scheme)}
            />
          }
        />
      ))}
    </GroupedList>
  );
}

export default VariantRows;
