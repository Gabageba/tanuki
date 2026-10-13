import useSources from '@/entities/source/hooks/useSources';
import { flattenSources } from '@/entities/source/lib';
import useUserSettings from '@/shared/hooks/useUserSettings';
import { getSelectionsSources } from '../lib';

/** Источники подборок с учётом настроек пользователя — в общем порядке источников. */
function useSelectionsSources() {
  const { data: sources, isPending: isSourcesPending } = useSources();
  const { data: settings, isPending: isSettingsPending } = useUserSettings();

  return {
    sources: getSelectionsSources(flattenSources(sources), settings),
    settings,
    isPending: isSourcesPending || isSettingsPending,
  };
}

export default useSelectionsSources;
