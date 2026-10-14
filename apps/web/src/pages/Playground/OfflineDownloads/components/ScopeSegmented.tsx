import { SegmentedControl, Stack, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { getScopeLabel } from '../lib';
import { DOWNLOAD_SCOPE, type DownloadFormValues, type DownloadScope } from '../models';
import RangeFields from './RangeFields';

type Props = {
  form: UseFormReturnType<DownloadFormValues>;
};

/** M1 — три сегмента; поля диапазона появляются только у «Диапазона». */
function ScopeSegmented({ form }: Props) {
  return (
    <Stack gap="xs">
      <SegmentedControl
        fullWidth
        data={Object.values(DOWNLOAD_SCOPE).map((scope) => ({
          value: scope,
          label: getScopeLabel(scope),
        }))}
        value={form.values.scope}
        onChange={(value) => form.setFieldValue('scope', value as DownloadScope)}
      />
      {form.values.scope === DOWNLOAD_SCOPE.RANGE && <RangeFields form={form} />}
      {form.errors.scope && (
        <Text c="red" fz={12}>
          {form.errors.scope}
        </Text>
      )}
    </Stack>
  );
}

export default ScopeSegmented;
