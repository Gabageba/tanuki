import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import GroupedList from '@/shared/ui/GroupedList';

/** Источники есть всегда, только число заранее неизвестно — заглушек столько, сколько их обычно. */
const SKELETON_ROWS = 8;

/** Загрузка вкладки «Источники»: те же пояснения и список, строки — заглушками. */
function SettingsSourcesSkeleton() {
  const { t } = useTranslation();

  return (
    <Stack mt="lg" gap="lg">
      <Stack gap={4}>
        <Text c="dimmed">{t('sourcesOrderIsUsedInListsSearchAndMatches')}</Text>
        <Text c="dimmed">{t('disabledSourcesAreHidden')}</Text>
      </Stack>
      <Stack maw={640} gap={4}>
        <GroupedList label={t('sources')} loading skeletonRows={SKELETON_ROWS} />
      </Stack>
    </Stack>
  );
}

export default SettingsSourcesSkeleton;
