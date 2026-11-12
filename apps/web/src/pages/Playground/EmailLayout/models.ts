import type { EnumLiteralsOf } from '@tanuki/contracts';
import { COLOR_SCHEME } from '@tanuki/contracts';
import type { SectionNavGroup } from '../components/SectionNav';

export const EMAIL_LAYOUT = {
  CURRENT: 'current',
  CARD: 'card',
  SHEET: 'sheet',
  PLAIN: 'plain',
} as const;
export type EmailLayout = EnumLiteralsOf<typeof EMAIL_LAYOUT>;

export const EMAIL_REVISION = {
  ORIGINAL: 'original',
  COMPACT_ACTION: 'compactAction',
  LARGE_ACTION: 'largeAction',
} as const;
export type EmailRevision = EnumLiteralsOf<typeof EMAIL_REVISION>;

export const EMAIL_KIND = {
  VERIFICATION: 'verification',
  PASSWORD_RESET: 'passwordReset',
  CHANGE_CODE: 'changeCode',
  EMAIL_CHANGED: 'emailChanged',
  DELETION: 'deletion',
} as const;
export type EmailKind = EnumLiteralsOf<typeof EMAIL_KIND>;
export type EmailScheme = Exclude<EnumLiteralsOf<typeof COLOR_SCHEME>, typeof COLOR_SCHEME.AUTO>;

export type EmailSample = {
  kind: EmailKind;
  name: string;
  subject: string;
  preheader: string;
  title: string;
  paragraphs: string[];
  detail?: { label: string; value: string };
  code?: string;
  action?: { label: string; url: string };
  expiry?: string;
  explanation: string;
  current: { subject: string; html: string };
};

export type EmailPalette = {
  background: string;
  surface: string;
  subtle: string;
  text: string;
  secondary: string;
  border: string;
  accent: string;
  actionText: string;
  link: string;
};

export type EmailPreviewOptions = {
  layout: EmailLayout;
  revision: EmailRevision;
  scheme: EmailScheme;
  brandedFonts: boolean;
  palette: EmailPalette;
};

export const VARIANTS = [
  {
    code: 'E0',
    layout: EMAIL_LAYOUT.CURRENT,
    revision: EMAIL_REVISION.ORIGINAL,
    title: 'Как сейчас',
    description:
      'Точная копия пяти текущих HTML-шаблонов: тёмный фон, фиолетовая кнопка, системный шрифт. Общие переключатели этот вариант не меняют.',
    pros: ['Короткие письма с одним основным действием'],
    cons: [
      'Палитра расходится с приложением, нет шапки Tanuki',
      'Длинная ссылка не переносится на телефоне',
      'Код, сроки и дата удаления оформлены по разным правилам',
    ],
  },
  {
    code: 'E1',
    layout: EMAIL_LAYOUT.CARD,
    revision: EMAIL_REVISION.ORIGINAL,
    title: 'Карточка на нейтральном фоне',
    description:
      'Шапка Tanuki над карточкой. Внутри — заголовок, содержание и действие; пояснение о безопасности и запасная ссылка отделены линией.',
    pros: ['Ближе всего к карточкам приложения', 'Основное действие отделено от служебного текста'],
    cons: ['Подложка и рамка оставляют меньше ширины для текста на телефоне'],
  },
  {
    code: 'E2',
    layout: EMAIL_LAYOUT.SHEET,
    revision: EMAIL_REVISION.ORIGINAL,
    title: 'Единое полотно',
    description:
      'Шапка и письмо на одной поверхности. Тонкая линия отделяет бренд от содержания, а срок действия остаётся рядом с кнопкой или кодом.',
    pros: ['Больше места тексту на телефоне', 'Чёткая структура без внешней карточки'],
    cons: ['Содержание слабее отделено от фона почтового клиента, чем в E1'],
  },
  {
    code: 'E3',
    layout: EMAIL_LAYOUT.PLAIN,
    revision: EMAIL_REVISION.ORIGINAL,
    title: 'Свободная текстовая колонка',
    description:
      'Без карточки, разделителей и плашек. Бренд, заголовок и текст образуют одну колонку; код и данные выделены только типографикой.',
    pros: ['Меньше визуального обрамления', 'Короткие письма выглядят легче'],
    cons: ['Меньше сходства с интерфейсом Tanuki', 'Служебный текст отделён только отступами'],
  },
  {
    code: 'E1a',
    layout: EMAIL_LAYOUT.CARD,
    revision: EMAIL_REVISION.COMPACT_ACTION,
    title: 'E1 · кнопка 36 px и короткая ссылка',
    description:
      'Карточка E1 с кнопкой по размерам приложения: обычное начертание 400, иконка 20 px по центру, промежуток 8 px. Вместо длинного адреса — «откройте ссылку в браузере».',
    pros: [
      'Кнопка совпадает по плотности с интерфейсом Tanuki',
      'Иконка выровнена с текстом, без смещения по базовой линии',
      'Длинный токен не перегружает письмо',
    ],
    cons: ['Область нажатия ниже, чем у E1b', 'Чтобы скопировать адрес, нужно открыть меню ссылки'],
  },
  {
    code: 'E1b',
    layout: EMAIL_LAYOUT.CARD,
    revision: EMAIL_REVISION.LARGE_ACTION,
    title: 'E1 · кнопка 44 px и короткая ссылка',
    description:
      'Те же исправления, что в E1a, с увеличенными вертикальными отступами кнопки. Начертание, иконка, короткая ссылка и все остальные части письма совпадают.',
    pros: ['Область нажатия выше, чем у E1a', 'Кнопка сохраняет лёгкое начертание текста'],
    cons: ['Кнопка выше, чем в приложении', 'На коротких письмах действие занимает больше места'],
  },
];

export const SECTION_GROUPS: SectionNavGroup[] = [
  {
    title: 'Верстка писем',
    axes: VARIANTS.filter(({ revision }) => revision === EMAIL_REVISION.ORIGINAL).map(
      ({ code, title }) => ({ letter: code, title }),
    ),
  },
  {
    title: 'Доработка E1',
    axes: VARIANTS.filter(({ revision }) => revision !== EMAIL_REVISION.ORIGINAL).map(
      ({ code, title }) => ({ letter: code, title }),
    ),
  },
  {
    title: 'Итог',
    axes: [{ letter: 'R', title: 'Выбран E1b' }],
  },
];

export const SCHEME_OPTIONS = [
  { value: COLOR_SCHEME.LIGHT, label: 'Светлая основа' },
  { value: COLOR_SCHEME.DARK, label: 'Тёмная адаптация' },
];
