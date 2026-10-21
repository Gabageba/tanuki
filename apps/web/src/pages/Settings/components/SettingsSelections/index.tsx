import { Stack } from '@mantine/core';
import useSources from '@/entities/source/hooks/useSources';
import type useUserSettings from '@/shared/hooks/useUserSettings';
import PageLayout from '@/shared/ui/PageLayout';
import QueryBlock from '@/shared/ui/QueryBlock';
import SelectionsSettingsHint from './SelectionsSettingsHint';
import SelectionsSourcesList from './SelectionsSourcesList';
import SettingsSelectionsSkeleton from './SettingsSelectionsSkeleton';

/**
 * Вкладка «Подборки» (T1a): источники с главной в общем порядке, у каждого переключатель и
 * галочки блоков, которые перетаскиваются. Хранятся выключенные — новый источник или блок у всех
 * сразу виден. Выключенных во вкладке «Источники» и скрытых настройкой 18+ здесь нет: в подборках
 * их не бывает.
 */
function SettingsSelections() {
  const sourcesQuery = useSources();
  const settingsQuery = PageLayout.useQuery<ReturnType<typeof useUserSettings>>();

  return (
    <QueryBlock query={[sourcesQuery, settingsQuery]} skeleton={<SettingsSelectionsSkeleton />}>
      {([sourcesData, settings]) => (
        <Stack gap="lg">
          <SelectionsSettingsHint />
          <Stack maw={640}>
            <SelectionsSourcesList sourcesData={sourcesData} settings={settings} />
          </Stack>
        </Stack>
      )}
    </QueryBlock>
  );
}

export default SettingsSelections;
