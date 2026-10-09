import { useState } from 'react';
import useUserSettings from '@/shared/hooks/useUserSettings';
import { readSettings, writeSettings } from '@/shared/lib/settings';

/**
 * Свёрнутые секции выдачи. Источник — настройки (localStorage, у авторизованного ещё и БД, см.
 * shared/lib/settings.ts): после переключения верим выбору на экране, до него — ответу сервера,
 * а пока его нет — localStorage.
 */
function useCollapsedSources() {
  const { data: serverSettings } = useUserSettings();
  const [toggled, setToggled] = useState<string[] | null>(null);
  const collapsedIds =
    toggled ??
    serverSettings?.collapsedSearchSources ??
    readSettings().collapsedSearchSources ??
    [];

  const toggle = (sourceId: string) => {
    const next = collapsedIds.includes(sourceId)
      ? collapsedIds.filter((id) => id !== sourceId)
      : [...collapsedIds, sourceId];
    setToggled(next);
    writeSettings({ collapsedSearchSources: next });
  };

  return { collapsedIds, toggle };
}

export default useCollapsedSources;
