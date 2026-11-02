import type { EnumLiteralsOf } from '@tanuki/contracts';
import type { SectionNavGroup } from '../components/SectionNav';

export const SETTINGS_LAYOUT = { CURRENT: 'current', INLINE: 'inline', GROUP: 'group' } as const;
export type SettingsLayout = EnumLiteralsOf<typeof SETTINGS_LAYOUT>;
export const PANEL_LAYOUT = { CURRENT: 'current', CONTROLS: 'controls', HEADER: 'header' } as const;
export type PanelLayout = EnumLiteralsOf<typeof PANEL_LAYOUT>;
export const SPREAD_ALIGN = { TOP: 'top', CENTER: 'center', BOTTOM: 'bottom' } as const;
export type SpreadAlign = EnumLiteralsOf<typeof SPREAD_ALIGN>;
export const SECTION_GROUPS: SectionNavGroup[] = [
  { title: 'Выбор', axes: [{ letter: 'result', title: 'Итог' }] },
  {
    title: 'Настройки',
    axes: [
      { letter: 'R', title: 'Режим и расположение' },
      { letter: 'S', title: 'Фон и поведение' },
    ],
  },
  {
    title: 'Чтение',
    axes: [
      { letter: 'P', title: 'Панель и счётчик' },
      { letter: 'D', title: 'Вид разворота' },
    ],
  },
];
