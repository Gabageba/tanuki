import { Box, Group, Radio, Stack, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { getDownloadScopeLabel } from './lib';
import { DOWNLOAD_SCOPE, type DownloadChaptersFormValues, type DownloadScope } from './models';
import RangeFields from './RangeFields';
import styles from './DownloadChaptersModal.module.scss';

type Props = {
  form: UseFormReturnType<DownloadChaptersFormValues>;
  /** Доступные режимы — «Диапазона» нет, когда номера глав в ветке повторяются. */
  scopes: DownloadScope[];
  /** Сколько глав встанет в очередь в каждом режиме. */
  getCount: (scope: DownloadScope) => number;
};

const isDownloadScope = (value: string): value is DownloadScope =>
  Object.values(DOWNLOAD_SCOPE).some((scope) => scope === value);

/** M2 — каждый режим карточкой со своим числом глав; у выбранного диапазона поля — в панели,
 *  пристыкованной снизу к его карточке. Не внутри: карточка — кнопка, и фон у неё тонированный. */
function ScopeRadioCards({ form, scopes, getCount }: Props) {
  const { t } = useTranslation();

  return (
    <Radio.Group
      value={form.values.scope}
      onChange={(value) => isDownloadScope(value) && form.setFieldValue('scope', value)}
      error={form.errors.scope}
    >
      <Stack gap="xs">
        {scopes.map((scope) => {
          const isRangeExpanded =
            scope === DOWNLOAD_SCOPE.RANGE && form.values.scope === DOWNLOAD_SCOPE.RANGE;
          return (
            <Box key={scope}>
              <Radio.Card
                value={scope}
                variant="tile"
                radius="md"
                p="sm"
                className={styles.rangeCard}
                mod={{ expanded: isRangeExpanded }}
              >
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
              </Radio.Card>
              {isRangeExpanded && (
                <Box p="sm" className={styles.rangePanel}>
                  <RangeFields form={form} />
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>
    </Radio.Group>
  );
}

export default ScopeRadioCards;
