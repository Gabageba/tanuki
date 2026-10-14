import { Group, Radio, Stack, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { countChaptersToDownload, formatChaptersCount, getScopeLabel } from '../lib';
import { DOWNLOAD_SCOPE, type DownloadFormValues, type DownloadScope } from '../models';
import RangeFields from './RangeFields';

type Props = {
  form: UseFormReturnType<DownloadFormValues>;
};

/** M2 — каждый режим карточкой со своим числом глав; диапазон раскрывается внутри карточки. */
function ScopeRadioCards({ form }: Props) {
  return (
    <Radio.Group
      value={form.values.scope}
      onChange={(value) => form.setFieldValue('scope', value as DownloadScope)}
      error={form.errors.scope}
    >
      <Stack gap="xs">
        {Object.values(DOWNLOAD_SCOPE).map((scope) => (
          <Radio.Card key={scope} value={scope} variant="tile" radius="md" p="sm">
            <Stack gap="xs">
              <Group gap="sm" wrap="nowrap">
                <Radio.Indicator variant="outline" />
                <Text fz="sm" flex={1}>
                  {getScopeLabel(scope)}
                </Text>
                {scope !== DOWNLOAD_SCOPE.RANGE && (
                  <Text fz={12} c="dimmed" ff="monospace">
                    {formatChaptersCount(countChaptersToDownload({ ...form.values, scope }))}
                  </Text>
                )}
              </Group>
              {scope === DOWNLOAD_SCOPE.RANGE && form.values.scope === DOWNLOAD_SCOPE.RANGE && (
                <RangeFields form={form} />
              )}
            </Stack>
          </Radio.Card>
        ))}
      </Stack>
    </Radio.Group>
  );
}

export default ScopeRadioCards;
