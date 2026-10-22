import { useTranslation } from 'react-i18next';
import {
  getSelectionsSectionKey,
  type SourcesResponse,
  type UserSettings,
} from '@tanuki/contracts';
import { flattenSources } from '@/entities/source/lib';
import { getOrderedSections } from '@/features/selections/lib';
import GroupedList from '@/shared/ui/GroupedList';
import useUpdateSelectionsSettings from './hooks/useUpdateSelectionsSettings';
import SelectionsSourceRow from './SelectionsSourceRow';

const toggle = (list: string[], value: string, isOn: boolean) =>
  isOn ? list.filter((item) => item !== value) : [...new Set([...list, value])];

/** Новый порядок блоков одного источника встаёт на место прежнего; порядок прочих не трогается. */
const reorder = (list: string[], keys: string[]) => [
  ...list.filter((item) => !keys.includes(item)),
  ...keys,
];

type Props = {
  sourcesData: SourcesResponse;
  settings: UserSettings;
};

/** Источники с блоками на главной: у каждого переключатель и галочки блоков. */
function SelectionsSourcesList({ sourcesData, settings }: Props) {
  const { t } = useTranslation();
  const update = useUpdateSelectionsSettings();

  const sources = flattenSources(sourcesData).filter(
    ({ isEnabled, homeSections }) => isEnabled && homeSections.length > 0,
  );
  const disabledSources = settings.selectionsDisabledSources ?? [];
  const disabledSections = settings.selectionsDisabledSections ?? [];

  return (
    <GroupedList label={t('sources')}>
      {sources.map((source) => (
        <SelectionsSourceRow
          key={source.id}
          source={source}
          sections={getOrderedSections(source, settings)}
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
          onSectionsReorder={(sectionIds) =>
            update((current) => ({
              selectionsSectionOrder: reorder(
                current?.selectionsSectionOrder ?? [],
                sectionIds.map((sectionId) => getSelectionsSectionKey(source.id, sectionId)),
              ),
            }))
          }
        />
      ))}
    </GroupedList>
  );
}

export default SelectionsSourcesList;
