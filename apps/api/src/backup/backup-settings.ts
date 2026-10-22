import type { BackupSettings } from '@tanuki/contracts';
import type { userSettings } from '../database/schema';
import { keepKnownSections, keepKnownSources } from './backup-plan';

type UserSettingsWrite = Omit<
  typeof userSettings.$inferInsert,
  'userId' | 'ageConfirmed' | 'updatedAt'
>;

/**
 * Строка `user_settings` из настроек копии — заменяет общие целиком: чего в копии нет, становится
 * null («не сохраняли»). Порядок источников — только известные инстансу: остальные встают в
 * конец, как новые.
 *
 * Подтверждения возраста в копии нет вовсе, а настройки 18+ берутся из неё, только если возраст уже
 * подтверждён здесь: сервер открывает 18+ по одному showAdultSources, и без этого файл обходил бы
 * вопрос «вам есть 18?». Не подтверждён — их колонок в записи нет, остаются свои.
 */
export const toUserSettingsWrite = (
  settings: BackupSettings,
  known: ReadonlySet<string>,
  isAgeConfirmed: boolean,
): UserSettingsWrite => {
  const { user } = settings;
  const adult = isAgeConfirmed
    ? {
        showAdultSources: user.showAdultSources ?? null,
        hideAdultTitles: user.hideAdultTitles ?? null,
      }
    : {};
  return {
    ...adult,
    colorScheme: user.colorScheme ?? null,
    viewMode: user.viewMode ?? null,
    language: user.language ?? null,
    exclusiveFilterConfirmDismissed: user.exclusiveFilterConfirmDismissed ?? null,
    timeZone: user.timeZone ?? null,
    saveSearchHistory: user.saveSearchHistory ?? null,
    collapsedSearchSources: keepKnownSources(user.collapsedSearchSources, known) ?? null,
    sourceOrder: keepKnownSources(settings.sourceOrder ?? undefined, known) ?? null,
    pushDisabledCategories: user.pushDisabledCategories ?? null,
    selectionsDisabledSources: keepKnownSources(user.selectionsDisabledSources, known) ?? null,
    selectionsDisabledSections: keepKnownSections(user.selectionsDisabledSections, known) ?? null,
    selectionsSectionOrder: keepKnownSections(user.selectionsSectionOrder, known) ?? null,
  };
};
