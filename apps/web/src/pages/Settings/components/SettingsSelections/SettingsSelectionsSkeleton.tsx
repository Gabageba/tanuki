import { Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import GroupedList from '@/shared/ui/GroupedList';
import SelectionsSettingsHint from './SelectionsSettingsHint';

/** Источников с главной — около полутора десятков; заглушек столько, сколько их обычно. */
const SKELETON_ROWS = 6;

/** Загрузка вкладки «Подборки»: то же пояснение и список, строки — заглушками. */
function SettingsSelectionsSkeleton() {
  const { t } = useTranslation();

  return (
    <Stack gap="lg">
      <SelectionsSettingsHint />
      <Stack maw={640}>
        <GroupedList label={t('sources')} loading skeletonRows={SKELETON_ROWS} />
      </Stack>
    </Stack>
  );
}

export default SettingsSelectionsSkeleton;
