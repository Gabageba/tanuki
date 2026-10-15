import type { EnumLiteralsOf } from '@tanuki/contracts';
import type { SectionNavGroup } from '../components/SectionNav';

/** Как устроена строка папки в настройках. Блок списка показывает строки одного вида. */
export const ROW_VARIANT = {
  /** V0 — тумблер, за ним меню; у встроенных на месте меню пустое место. */
  CURRENT: 'current',
  /** V0a — как V0, но место под меню держится, только когда в списке есть своя папка. */
  CURRENT_COMPACT: 'currentCompact',
  /** V1 — тумблер слева, после ручки; справа только меню своих. */
  SWITCH_LEFT: 'switchLeft',
  /** V2 — меню нет, своя папка открывается кликом по строке. */
  ROW_CLICK: 'rowClick',
  /** V3 — меню нет, у своей папки карандаш за названием. */
  PENCIL: 'pencil',
  /** V4, первый блок — только порядок: ручка, иконка, название, меню своих. */
  ORDER: 'order',
  /** V4, второй блок — только слежение: иконка, название, тумблер. */
  TRACKING: 'tracking',
} as const;
export type RowVariant = EnumLiteralsOf<typeof ROW_VARIANT>;

/** Ширина меню «⋯» — V0 и V0a держат под него место у встроенных. */
export const MENU_WIDTH = 28;

/** Ось E — как своя папка показывает, что её можно открыть и изменить. */
export const EDIT_HINT = {
  /** E1 — карандаш у названия при наведении, на телефоне всегда. */
  HOVER_PENCIL: 'hoverPencil',
  /** E2 — подпись под названием: «Изменить» у своих, «Встроенная» у встроенных. */
  CAPTION: 'caption',
  /** E3 — каретка у названия, строка раскрывает редактор на месте. */
  EXPAND: 'expand',
} as const;
export type EditHint = EnumLiteralsOf<typeof EDIT_HINT>;

/** Ось D — где удаляется своя папка. */
export const DELETE_PLACE = {
  /** D1 — режим «Изменить список»: тумблеры своих меняются на корзины. */
  EDIT_MODE: 'editMode',
  /** D2 — отдельная зона внизу модалки или редактора, ниже «Сохранить». */
  ZONE: 'zone',
  /** D3 — папку перетаскивают в подвал списка. */
  DROP_ZONE: 'dropZone',
} as const;
export type DeletePlace = EnumLiteralsOf<typeof DELETE_PLACE>;

/** Куда бросать папку в D3. */
export const DROP_ZONE_ID = 'delete-folder';

export const SECTION_GROUPS: SectionNavGroup[] = [
  { title: 'Итог', axes: [{ letter: '★', title: 'Выбранный вариант' }] },
  { title: 'Первый круг', axes: [{ letter: 'V', title: 'Устройство строки' }] },
  {
    title: 'Без меню (развитие V2)',
    axes: [
      { letter: 'E', title: 'Как понять, что папка правится' },
      { letter: 'D', title: 'Где удалять папку' },
    ],
  },
];
