import { useState } from 'react';
import { Switch } from '@mantine/core';
import { type Query, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ImagesIcon, StackIcon } from '@phosphor-icons/react';
import {
  DEFAULT_HIDE_ADULT_TITLES,
  DEFAULT_SHOW_ADULT_SOURCES,
  type UserSettings,
} from '@tanuki/contracts';
import { USER_SETTINGS_QUERY_KEY } from '@/shared/hooks/useUserSettings';
import type useUserSettings from '@/shared/hooks/useUserSettings';
import PageLayout from '@/shared/ui/PageLayout';
import useSkeletonTiming from '@/shared/ui/QueryBlock/hooks/useSkeletonTiming';
import useUpdateUserSettings from '@/shared/hooks/useUpdateUserSettings';
import GroupedList from '@/shared/ui/GroupedList';
import AdultCoversPreview from './AdultCoversPreview';
import AgeConfirmModal from './AgeConfirmModal';
import { getAdultTitlesDescription } from './lib';

/**
 * Две настройки 18+: главная — весь контент 18+ (источники 18+ целиком плюс тайтлы 18+ на обычных
 * источниках) и под ней тайтлы 18+ на обычных источниках отдельно (размытие и закрытая страница).
 * Прятать тайтлы на обычных источниках, показывая целые источники 18+, бессмысленно, поэтому при
 * включённой главной тумблер тайтлов заблокирован включённым. Всё, что открывает 18+, — только после подтверждения возраста (его
 * спрашиваем один раз); скрыть можно сразу.
 */
function SettingsAdultContent() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const settingsQuery = PageLayout.useQuery<ReturnType<typeof useUserSettings>>();
  const settings = settingsQuery.data;
  const { isSkeleton } = useSkeletonTiming(settingsQuery);
  const updateUserSettings = useUpdateUserSettings();
  const [pendingReveal, setPendingReveal] = useState<UserSettings | null>(null);

  const hideAdultTitles = settings?.hideAdultTitles ?? DEFAULT_HIDE_ADULT_TITLES;
  const showAdultSources = settings?.showAdultSources ?? DEFAULT_SHOW_ADULT_SOURCES;
  const isAgeConfirmed = settings?.ageConfirmed ?? false;

  // От этих настроек зависят почти все ответы сервера — источники, каталог, поиск, тайтлы.
  // Неактивный кеш удаляется, а не помечается устаревшим: иначе на других страницах скрытое
  // мелькнуло бы из кеша. Активные запросы этой страницы (пользователь, источники) только
  // перезапрашиваются фоном — сброс увёл бы всю страницу в загрузку.
  const handleChange = (patch: UserSettings) => {
    queryClient.setQueryData<UserSettings>(USER_SETTINGS_QUERY_KEY, (current) => ({
      ...current,
      ...patch,
    }));
    updateUserSettings.mutate(patch, {
      onSuccess: () => {
        const predicate = (query: Query) => query.queryKey[0] !== USER_SETTINGS_QUERY_KEY[0];
        queryClient.removeQueries({ type: 'inactive', predicate });
        queryClient.invalidateQueries({ type: 'active', predicate });
      },
      onError: () => queryClient.invalidateQueries({ queryKey: USER_SETTINGS_QUERY_KEY }),
    });
  };

  // Возраст спрашиваем один раз: после подтверждения 18+ открывается сразу.
  const handleReveal = (patch: UserSettings) =>
    isAgeConfirmed ? handleChange(patch) : setPendingReveal(patch);

  const handleConfirm = () => {
    if (pendingReveal) handleChange({ ...pendingReveal, ageConfirmed: true });
    setPendingReveal(null);
  };

  return (
    <>
      <GroupedList label={t('adultContent')} loading={isSkeleton}>
        <GroupedList.Row
          icon={<StackIcon />}
          title={t('allAdultContent')}
          description={
            showAdultSources
              ? t('adultSourcesAndTitlesOnRegularSources')
              : t('adultSourcesHiddenFromListAndSearch')
          }
          action={
            <Switch
              checked={showAdultSources}
              onChange={(event) =>
                event.currentTarget.checked
                  ? handleReveal({ showAdultSources: true, hideAdultTitles: false })
                  : handleChange({ showAdultSources: false })
              }
            />
          }
        />
        <GroupedList.Row
          icon={<ImagesIcon />}
          title={t('adultTitlesOnRegularSources')}
          description={getAdultTitlesDescription(showAdultSources, hideAdultTitles, t)}
          action={
            <Switch
              checked={!hideAdultTitles}
              disabled={showAdultSources}
              onChange={(event) =>
                event.currentTarget.checked
                  ? handleReveal({ hideAdultTitles: false })
                  : handleChange({ hideAdultTitles: true })
              }
            />
          }
        />
        <AdultCoversPreview isBlurred={hideAdultTitles} />
      </GroupedList>
      <AgeConfirmModal
        opened={Boolean(pendingReveal)}
        description={
          pendingReveal?.showAdultSources
            ? t('adultSourcesAndTitlesWillBecomeVisible')
            : t('adultTitlesWillBecomeVisible')
        }
        onConfirm={handleConfirm}
        onClose={() => setPendingReveal(null)}
      />
    </>
  );
}

export default SettingsAdultContent;
