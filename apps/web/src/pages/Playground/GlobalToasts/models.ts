import type { ReactNode } from 'react';
import type { ButtonProps } from '@mantine/core';
import type { EnumLiteralsOf } from '@tanuki/contracts';
import type { NotificationTone } from '@/entities/notification/models';
import type { SectionNavGroup } from '../components/SectionNav';

export const ACCENT_STYLE = { STRIPE: 'stripe', ICON: 'icon' } as const;
export type AccentStyle = EnumLiteralsOf<typeof ACCENT_STYLE>;
export const TEXT_DENSITY = { COMPACT: 'compact', RELAXED: 'relaxed' } as const;
export type TextDensity = EnumLiteralsOf<typeof TEXT_DENSITY>;
export const ACTION_LAYOUT = { ADAPTIVE: 'adaptive', BELOW: 'below' } as const;
export type ActionLayout = EnumLiteralsOf<typeof ACTION_LAYOUT>;
export const ACTION_STYLE = {
  SUBTLE: 'subtle',
  DEFAULT: 'default',
  MUTED: 'muted',
  FOOTER: 'footer',
} as const;
export type ActionStyle = EnumLiteralsOf<typeof ACTION_STYLE>;
export const ACTION_SIZE = {
  REGULAR: 'regular',
  COMPACT: 'compact',
  DENSE: 'dense',
  NATIVE_XS: 'nativeXs',
  NATIVE_SM: 'nativeSm',
  NATIVE_MD: 'nativeMd',
} as const;
export type ActionSize = EnumLiteralsOf<typeof ACTION_SIZE>;
export const TITLE_WEIGHT = {
  CONTEXTUAL: 'contextual',
  REGULAR: 'regular',
  MEDIUM: 'medium',
  SEMIBOLD: 'semibold',
} as const;
export type TitleWeight = EnumLiteralsOf<typeof TITLE_WEIGHT>;
export const CONTENT_ALIGNMENT = {
  TOP: 'top',
  SIMPLE_CENTER: 'simpleCenter',
  HEADER: 'header',
} as const;
export type ContentAlignment = EnumLiteralsOf<typeof CONTENT_ALIGNMENT>;
export const EVENT_HINT = { HOVER: 'hover', ARROW: 'arrow' } as const;
export type EventHint = EnumLiteralsOf<typeof EVENT_HINT>;
export const TOAST_KIND = {
  MESSAGE: 'message',
  EVENT: 'event',
  RESTORE: 'restore',
  PWA: 'pwa',
} as const;
export type ToastKind = EnumLiteralsOf<typeof TOAST_KIND>;
export const VIEWPORT_CONTEXT = { APP: 'app', READER: 'reader', AUTH: 'auth' } as const;
export type ViewportContext = EnumLiteralsOf<typeof VIEWPORT_CONTEXT>;
export const OVERLAY_KIND = { MODAL: 'modal', DRAWER: 'drawer' } as const;
export type OverlayKind = EnumLiteralsOf<typeof OVERLAY_KIND>;

export type ToastAppearance = {
  accent: AccentStyle;
  density: TextDensity;
  actionLayout: ActionLayout;
  eventHint: EventHint;
  actionStyle: ActionStyle;
  actionSize: ActionSize;
  titleWeight: TitleWeight;
  contentAlignment: ContentAlignment;
};
export type ToastSample = {
  id: string;
  title: string;
  description?: string;
  icon: ReactNode;
  tone: NotificationTone;
  kind: ToastKind;
  duration: number | null;
  security?: boolean;
  background?: boolean;
};
export type DemoToast = ToastSample & { remaining: number | null };
export type DemoState = {
  visible: DemoToast[];
  pending: DemoToast[];
  reader: boolean;
  hovered: string[];
  focused: string[];
};
export type ActionSizeProps = Pick<ButtonProps, 'size' | 'maw' | 'h' | 'mih' | 'py' | 'styles'>;
export const ACTION_BUTTON_PROPS: ActionSizeProps = {
  size: 'sm',
  maw: '100%',
  h: 'auto',
  mih: 36,
  py: 6,
  styles: {
    root: { display: 'inline-flex', alignItems: 'center' },
    inner: { height: 'auto', minWidth: 0, width: '100%' },
    label: { whiteSpace: 'normal', height: 'auto', textAlign: 'left', lineHeight: 1.35 },
  },
};
export const MAX_VISIBLE = 3;
export const BASE_APPEARANCE: ToastAppearance = {
  accent: ACCENT_STYLE.ICON,
  density: TEXT_DENSITY.COMPACT,
  actionLayout: ACTION_LAYOUT.BELOW,
  eventHint: EVENT_HINT.HOVER,
  actionStyle: ACTION_STYLE.SUBTLE,
  actionSize: ACTION_SIZE.REGULAR,
  titleWeight: TITLE_WEIGHT.CONTEXTUAL,
  contentAlignment: CONTENT_ALIGNMENT.TOP,
};
export const RESULT_APPEARANCE: ToastAppearance = {
  ...BASE_APPEARANCE,
  accent: ACCENT_STYLE.STRIPE,
  density: TEXT_DENSITY.RELAXED,
  actionLayout: ACTION_LAYOUT.BELOW,
  eventHint: EVENT_HINT.HOVER,
};
export const REVISED_RESULT_APPEARANCE: ToastAppearance = {
  ...RESULT_APPEARANCE,
  actionStyle: ACTION_STYLE.FOOTER,
  titleWeight: TITLE_WEIGHT.SEMIBOLD,
  contentAlignment: CONTENT_ALIGNMENT.SIMPLE_CENTER,
};
export const RESULT_TOAST_WIDTH = 420;
export const RESULT_STACK_GAP = 12;
export const SECTION_GROUPS: SectionNavGroup[] = [
  {
    title: 'Карточка',
    axes: [
      { letter: 'B', title: 'Как сейчас' },
      { letter: 'A', title: 'Цветовой акцент' },
      { letter: 'T', title: 'Текст и плотность' },
      { letter: 'D', title: 'Кнопка действия' },
    ],
  },
  {
    title: 'Поведение и окружение',
    axes: [
      { letter: 'S', title: 'Размеры и стек' },
      { letter: 'O', title: 'Оверлеи и клавиатура' },
      { letter: 'I', title: 'Наведение и фокус' },
      { letter: 'Q', title: 'Очередь и таймеры' },
      { letter: 'C', title: 'Выравнивание' },
      { letter: 'R', title: 'Итог' },
    ],
  },
];

export type AppearanceVariant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  appearance: Partial<ToastAppearance>;
  width?: number;
  samples?: ToastSample[];
};
