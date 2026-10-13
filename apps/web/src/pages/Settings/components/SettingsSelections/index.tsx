import { Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { getSelectionsSectionKey } from '@tanuki/contracts';
import useSources from '@/entities/source/hooks/useSources';
import { flattenSources } from '@/entities/source/lib';
import useUserSettings from '@/shared/hooks/useUserSettings';
import GroupedList from '@/shared/ui/GroupedList';
import useUpdateSelectionsSettings from './hooks/useUpdateSelectionsSettings';
import SelectionsSettingsHint from './SelectionsSettingsHint';
import SelectionsSourceRow from './SelectionsSourceRow';
import SettingsSelectionsSkeleton from './SettingsSelectionsSkeleton';

const toggle = (list: string[], value: string, isOn: boolean) =>
  isOn ? list.filter((item) => item !== value) : [...new Set([...list, value])];

/**
 * Вкладка «Подборки» (T1a): источники с главной в общем порядке, у каждого переключатель и
 * галочки блоков. Хранятся выключенные — новый источник или блок у всех сразу виден.
 * Выключенных во вкладке «Источники» и скрытых настройкой 18+ здесь нет: в подборках их не бывает.
 */
function SettingsSelections() {
  const { t } = useTranslation();
  const { data, isPending } = useSources();
  const { data: settings } = useUserSettings();
  const update = useUpdateSelectionsSettings();

  if (isPending) {
    return <SettingsSelectionsSkeleton />;
  }

  const sources = flattenSources(data).filter(
    ({ isEnabled, homeSections }) => isEnabled && homeSections.length > 0,
  );
  const disabledSources = settings?.selectionsDisabledSources ?? [];
  const disabledSections = settings?.selectionsDisabledSections ?? [];

  return (
    <Stack gap="lg">
      <SelectionsSettingsHint />
      <Stack maw={640}>
        <GroupedList label={t('sources')}>
          {sources.map((source) => (
            <SelectionsSourceRow
              key={source.id}
              source={source}
              isSourceOn={!disabledSources.includes(source.id)}
              isSectionOn={(sectionId) =>
                !disabledSections.includes(getSelectionsSectionKey(source.id, sectionId))
              }
              onSourceChange={(isOn) =>
                update((current) => ({
                  selectionsDisabledSources: toggle(
                    current?.selectionsDisabledSources ?? [],
                    source.id,
                    isOn,
                  ),
                }))
              }
              onSectionChange={(sectionId, isOn) =>
                update((current) => ({
                  selectionsDisabledSections: toggle(
                    current?.selectionsDisabledSections ?? [],
                    getSelectionsSectionKey(source.id, sectionId),
                    isOn,
                  ),
                }))
              }
            />
          ))}
        </GroupedList>
      </Stack>
    </Stack>
  );
}

export default SettingsSelections;
