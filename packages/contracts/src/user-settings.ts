import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';
import { LanguageSchema } from './language';

export const COLOR_SCHEME = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;
export type ColorScheme = EnumLiteralsOf<typeof COLOR_SCHEME>;
export const ColorSchemeSchema = z.enum(COLOR_SCHEME);

export const VIEW_MODE = {
  GRID: 'grid',
  LIST: 'list',
} as const;
export type ViewMode = EnumLiteralsOf<typeof VIEW_MODE>;
export const ViewModeSchema = z.enum(VIEW_MODE);

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
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const UpdateUserSettingsRequestSchema = UserSettingsSchema;
export type UpdateUserSettingsRequest = z.infer<typeof UpdateUserSettingsRequestSchema>;
