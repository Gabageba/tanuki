import { useState } from 'react';
import { getBlockKey } from '../lib';
import type { HomeSettingsState } from '../models';

/** Как в макете настроили главную сначала: Desu выключен, у Реманги снято «Популярное». */
const INITIAL_STATE: HomeSettingsState = {
  disabledSources: ['desume'],
  disabledBlocks: ['remanga:popular', 'mangalib:readingNowRising'],
};

/** Живой выбор вкладки «Главная»: хранится выключенное, как `home_disabled_*` в плане. */
function useHomeSettingsMock() {
  const [state, setState] = useState(INITIAL_STATE);

  const isSourceOn = (sourceId: string) => !state.disabledSources.includes(sourceId);

  const isBlockOn = (sourceId: string, blockId: string) =>
    !state.disabledBlocks.includes(getBlockKey(sourceId, blockId));

  const setSourceOn = (sourceId: string, isOn: boolean) =>
    setState((prev) => ({
      ...prev,
      disabledSources: isOn
        ? prev.disabledSources.filter((id) => id !== sourceId)
        : [...prev.disabledSources, sourceId],
    }));

  const setBlockOn = (sourceId: string, blockId: string, isOn: boolean) => {
    const key = getBlockKey(sourceId, blockId);
    setState((prev) => ({
      ...prev,
      disabledBlocks: isOn
        ? prev.disabledBlocks.filter((item) => item !== key)
        : [...prev.disabledBlocks, key],
    }));
  };

  /** Включённые блоки источника разом — из мультиселекта или галочки «все». */
  const setEnabledBlocks = (sourceId: string, allIds: string[], enabledIds: string[]) => {
    const keys = allIds.map((id) => getBlockKey(sourceId, id));
    const disabled = allIds
      .filter((id) => !enabledIds.includes(id))
      .map((id) => getBlockKey(sourceId, id));
    setState((prev) => ({
      ...prev,
      disabledBlocks: [...prev.disabledBlocks.filter((key) => !keys.includes(key)), ...disabled],
    }));
  };

  return { isSourceOn, isBlockOn, setSourceOn, setBlockOn, setEnabledBlocks };
}

export default useHomeSettingsMock;
