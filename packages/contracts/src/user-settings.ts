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
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const UpdateUserSettingsRequestSchema = UserSettingsSchema;
export type UpdateUserSettingsRequest = z.infer<typeof UpdateUserSettingsRequestSchema>;
