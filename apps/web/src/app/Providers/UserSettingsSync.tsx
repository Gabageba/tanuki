import { useEffect, useRef } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import i18next from 'i18next';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import useUserSettings from '@/shared/hooks/useUserSettings';
import useUpdateUserSettings from '@/shared/hooks/useUpdateUserSettings';
import { readSettings, setSettingsSyncHandler, writeSettings } from '@/shared/lib/settings';

/**
 * Источник настроек всегда localStorage — тема должна примениться ещё до первой отрисовки (см.
 * инлайн-скрипт в index.html), а читалке нечем ждать сеть. Для авторизованных эта БД-строка
 * синхронизирует его между устройствами: один раз за сессию логина серверные значения
 * применяются к localStorage и живому состоянию (или, если в БД ещё пусто, наоборот — туда
 * уходит то, что уже накопилось локально), а дальше каждое локальное изменение фоном летит в БД
 * через writeSettings/setSettingsSyncHandler.
 */
function UserSettingsSync() {
  const { data: user } = useCurrentUser();
  const { data: serverSettings } = useUserSettings();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const updateUserSettings = useUpdateUserSettings();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      appliedRef.current = false;
      return undefined;
    }
    setSettingsSyncHandler((patch) => updateUserSettings.mutate(patch));
    return () => setSettingsSyncHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user || !serverSettings || appliedRef.current) return;
    appliedRef.current = true;

    // Часовой пояс нужен только серверу — для статистики чтения. Пока его нет, берём браузерный;
    // дальше он меняется лишь вручную, на странице настроек.
    if (!serverSettings.timeZone) {
      updateUserSettings.mutate({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    }

    // Пояс сервер знает и без localStorage — сам по себе он не значит, что остальное уже в БД.
    const hasStoredSettings = Object.entries(serverSettings).some(
      ([key, value]) => key !== 'timeZone' && value !== undefined,
    );
    if (!hasStoredSettings) {
      const local = readSettings();
      if (Object.values(local).some((value) => value !== undefined)) {
        updateUserSettings.mutate(local);
      }
      return;
    }

    if (serverSettings.colorScheme && serverSettings.colorScheme !== colorScheme) {
      setColorScheme(serverSettings.colorScheme);
    }
    if (serverSettings.language && serverSettings.language !== i18next.language) {
      i18next.changeLanguage(serverSettings.language);
    }
    writeSettings({
      viewMode: serverSettings.viewMode,
      exclusiveFilterConfirmDismissed: serverSettings.exclusiveFilterConfirmDismissed,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, serverSettings]);

  return null;
}

export default UserSettingsSync;
