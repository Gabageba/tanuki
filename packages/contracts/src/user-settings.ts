import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';
import { LanguageSchema } from './language';
import { NotificationCategorySchema } from './notification';
import { ViewModeSchema } from './view-mode';

export const COLOR_SCHEME = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;
export type ColorScheme = EnumLiteralsOf<typeof COLOR_SCHEME>;
export const ColorSchemeSchema = z.enum(COLOR_SCHEME);

/** Зону проверяет сам Intl: он знает ровно те IANA-зоны, с которыми потом и будет считать. */
export const isValidTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
};

export const TimeZoneSchema = z.string().min(1).refine(isValidTimeZone);

/**
 * Что действует, пока пользователь не выбрал сам (и для гостя): контент 18+ закрыт. Сервер по
 * этим значениям режет ответы, фронт — показывает переключатели и размывает обложки.
 */
export const DEFAULT_SHOW_ADULT_SOURCES = false;
export const DEFAULT_HIDE_ADULT_TITLES = true;
/** История поиска пишется, пока пользователь её не выключил. */
export const DEFAULT_SAVE_SEARCH_HISTORY = true;

/**
 * Настройки, не завязанные на конкретную страницу (тема, вид каталога, язык, отказ от диалога
 * исключающих фильтров) — одна строка на пользователя в БД, синхронизирующая их между
 * устройствами. Источник истины для гостя — localStorage на клиенте (shared/lib/settings.ts), так
 * что все поля опциональны: партиальный ответ значит «остального в БД ещё нет».
 */
export const UserSettingsSchema = z.object({
  colorScheme: ColorSchemeSchema.optional(),
  viewMode: ViewModeSchema.optional(),
  language: LanguageSchema.optional(),
  exclusiveFilterConfirmDismissed: z.boolean().optional(),
  /** Часовой пояс, по которому статистика чтения режет сутки и месяцы. */
  timeZone: TimeZoneSchema.optional(),
  /** Показывать ли источники с меткой 18+ (SOURCE_CATALOG.isAdult). Выключено — их нет нигде. */
  showAdultSources: z.boolean().optional(),
  /**
   * Прятать ли тайтлы 18+ в обычных источниках, где они идут вперемешку с остальными: обложка
   * размыта, страница тайтла и его главы не открываются.
   */
  hideAdultTitles: z.boolean().optional(),
  /** Возраст подтверждён: открыть 18+ можно без повторного вопроса «Вам есть 18?». */
  ageConfirmed: z.boolean().optional(),
  /**
   * Пишет ли сервер недавние запросы поиска. Отсутствие — включено; выключение стирает уже
   * накопленное.
   */
  saveSearchHistory: z.boolean().optional(),
  /** Источники, чья секция в выдаче поиска свёрнута: id. Отсутствие — все развёрнуты. */
  collapsedSearchSources: z.array(z.string()).optional(),
  /** Категории уведомлений, для которых push выключен. Отсутствие — включены все. */
  pushDisabledCategories: z.array(NotificationCategorySchema).optional(),
  /** Источники, убранные из подборок: id. Отсутствие — показываются все. */
  selectionsDisabledSources: z.array(z.string()).optional(),
  /** Выключенные блоки подборок: `sourceId:sectionId` (`getSelectionsSectionKey`). */
  selectionsDisabledSections: z.array(z.string()).optional(),
  /**
   * Порядок блоков подборок: ключи `sourceId:sectionId` по порядку. Блоки, которых здесь нет
   * (новые), встают в конец в порядке сайта.
   */
  selectionsSectionOrder: z.array(z.string()).optional(),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const UpdateUserSettingsRequestSchema = UserSettingsSchema;
export type UpdateUserSettingsRequest = z.infer<typeof UpdateUserSettingsRequestSchema>;

/** Ключ блока подборок в `selectionsDisabledSections` и `selectionsSectionOrder`. */
export const getSelectionsSectionKey = (sourceId: string, sectionId: string) =>
  `${sourceId}:${sectionId}`;
