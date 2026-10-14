import { Group, Radio, Stack, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { getDownloadScopeLabel } from './lib';
import { DOWNLOAD_SCOPE, type DownloadChaptersFormValues, type DownloadScope } from './models';
import RangeFields from './RangeFields';

type Props = {
  form: UseFormReturnType<DownloadChaptersFormValues>;
  /** Доступные режимы — «Диапазона» нет, когда номера глав в ветке повторяются. */
  scopes: DownloadScope[];
  /** Сколько глав встанет в очередь в каждом режиме. */
  getCount: (scope: DownloadScope) => number;
};

const isDownloadScope = (value: string): value is DownloadScope =>
  Object.values(DOWNLOAD_SCOPE).some((scope) => scope === value);

/** M2 — каждый режим карточкой со своим числом глав; диапазон раскрывается внутри карточки. */
function ScopeRadioCards({ form, scopes, getCount }: Props) {
  const { t } = useTranslation();

  return (
    <Radio.Group
      value={form.values.scope}
      onChange={(value) => isDownloadScope(value) && form.setFieldValue('scope', value)}
      error={form.errors.scope}
    >
      <Stack gap="xs">
        {scopes.map((scope) => (
          <Radio.Card key={scope} value={scope} variant="tile" radius="md" p="sm">
            <Stack gap="xs">
              <Group gap="sm" wrap="nowrap">
                <Radio.Indicator variant="outline" />
                <Text fz="sm" flex={1}>
                  {getDownloadScopeLabel(scope, t)}
                </Text>
                {scope !== DOWNLOAD_SCOPE.RANGE && (
                  <Text fz="xs" c="dimmed" ff="monospace">
                    {t('countChaptersAbbrev', { count: getCount(scope) })}
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
