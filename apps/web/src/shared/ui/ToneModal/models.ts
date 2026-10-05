import type { EnumLiteralsOf } from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';

/** Тон модалки — совпадает с тем, насколько действие обратимо (см. docs/11-ui-decisions.md,
 *  «Таблица приглашений и модалки»). */
export const MODAL_TONE = {
  /** Необратимо или бьёт по чужому аккаунту. */
  DANGER: 'danger',
  /** Обратимо, но что-то сбросится, откроется или перезагрузится. */
  WARNING: 'warning',
  /** Обычная форма. */
  NEUTRAL: 'neutral',
  /** Результат. */
  SUCCESS: 'success',
} as const;
export type ModalTone = EnumLiteralsOf<typeof MODAL_TONE>;

/** Цвет иконки у заголовка. Нейтральный — цвет пояснений, а не залитый серый: иначе иконка
 *  выглядит неактивной кнопкой. */
export const getModalToneColor = (tone: ModalTone) => {
  switch (tone) {
    case MODAL_TONE.DANGER:
      return 'var(--mantine-color-red-filled)';
    case MODAL_TONE.WARNING:
      return `var(--mantine-color-${STATUS_DEGRADED_COLOR}-filled)`;
    case MODAL_TONE.NEUTRAL:
      return 'var(--mantine-color-dimmed)';
    case MODAL_TONE.SUCCESS:
      return 'var(--mantine-color-teal-filled)';
  }
};
