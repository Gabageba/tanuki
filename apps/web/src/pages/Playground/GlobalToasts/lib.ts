import type { ButtonProps } from '@mantine/core';
import { FEEDBACK_TONE, type FeedbackTone } from '@/shared/lib/feedback';
import {
  ACCENT_STYLE,
  ACTION_STYLE,
  ACTION_SIZE,
  type ActionSize,
  type ActionSizeProps,
  ACTION_BUTTON_PROPS,
  BASE_APPEARANCE,
  CONTENT_ALIGNMENT,
  TITLE_WEIGHT,
  type ActionStyle,
  type ContentAlignment,
  type ToastAppearance,
  type TitleWeight,
  ACTION_LAYOUT,
  TEXT_DENSITY,
  TOAST_KIND,
  VIEWPORT_CONTEXT,
  type ViewportContext,
  type AccentStyle,
  type ActionLayout,
  type DemoState,
  type DemoToast,
  type TextDensity,
} from './models';

export const hasStripe = (accent: AccentStyle) => {
  switch (accent) {
    case ACCENT_STYLE.STRIPE:
      return true;
    case ACCENT_STYLE.ICON:
      return false;
  }
};
export const getPadding = (density: TextDensity) => {
  switch (density) {
    case TEXT_DENSITY.COMPACT:
      return 12;
    case TEXT_DENSITY.RELAXED:
      return 16;
  }
};
export const getContextualTitleWeight = (density: TextDensity) => {
  switch (density) {
    case TEXT_DENSITY.COMPACT:
      return 500;
    case TEXT_DENSITY.RELAXED:
      return 600;
  }
};
export const isAdaptive = (layout: ActionLayout) => {
  switch (layout) {
    case ACTION_LAYOUT.ADAPTIVE:
      return true;
    case ACTION_LAYOUT.BELOW:
      return false;
  }
};
export const isProtected = (toast: DemoToast) =>
  toast.kind === TOAST_KIND.RESTORE || toast.security === true;
export const getPriority = (toast: DemoToast) => {
  if (isProtected(toast)) return 2;
  if (toast.kind === TOAST_KIND.PWA) return 0;
  return 1;
};
export const canShow = (toast: DemoToast, reader: boolean) =>
  !reader || (!toast.background && toast.kind !== TOAST_KIND.PWA);
export const createDemoState = (): DemoState => ({
  visible: [],
  pending: [],
  reader: false,
  hovered: [],
  focused: [],
});

export const getAnnouncementRole = (tone: FeedbackTone) => {
  switch (tone) {
    case FEEDBACK_TONE.DANGER:
      return 'alert';
    case FEEDBACK_TONE.WARNING:
    case FEEDBACK_TONE.SUCCESS:
    case FEEDBACK_TONE.ACCENT:
    case FEEDBACK_TONE.NEUTRAL:
      return 'status';
  }
};

export const getViewportBackground = (context: ViewportContext) => {
  switch (context) {
    case VIEWPORT_CONTEXT.APP:
    case VIEWPORT_CONTEXT.AUTH:
      return 'var(--mantine-color-body)';
    // Фон читалки всегда чёрный, независимо от темы приложения.
    case VIEWPORT_CONTEXT.READER:
      return '#000';
  }
};

export const getVisualViewport = () => ({
  width: window.visualViewport?.width ?? window.innerWidth,
  height: window.visualViewport?.height ?? window.innerHeight,
  top: window.visualViewport?.offsetTop ?? 0,
  left: window.visualViewport?.offsetLeft ?? 0,
});

export const getTitleWeight = (
  weight: TitleWeight,
  density: TextDensity,
  hasDescription: boolean,
) => {
  switch (weight) {
    case TITLE_WEIGHT.CONTEXTUAL:
      return hasDescription ? getContextualTitleWeight(density) : 400;
    case TITLE_WEIGHT.REGULAR:
      return 400;
    case TITLE_WEIGHT.MEDIUM:
      return 500;
    case TITLE_WEIGHT.SEMIBOLD:
      return 600;
  }
};

export const getActionSizeProps = (size: ActionSize): ActionSizeProps => {
  switch (size) {
    case ACTION_SIZE.REGULAR:
      return { ...ACTION_BUTTON_PROPS, size: 'sm', mih: 36, py: 6 };
    case ACTION_SIZE.COMPACT:
      return { ...ACTION_BUTTON_PROPS, size: 'compact-sm', mih: 30, py: 3 };
    case ACTION_SIZE.DENSE:
      return { ...ACTION_BUTTON_PROPS, size: 'compact-sm', mih: 26, py: 1 };
    case ACTION_SIZE.NATIVE_XS:
      return { size: 'compact-xs' };
    case ACTION_SIZE.NATIVE_SM:
      return { size: 'compact-sm' };
    case ACTION_SIZE.NATIVE_MD:
      return { size: 'compact-md' };
  }
};

export const getActionButtonProps = (
  appearance?: Partial<ToastAppearance>,
): ActionSizeProps & Pick<ButtonProps, 'variant'> => {
  const style = appearance?.actionStyle ?? BASE_APPEARANCE.actionStyle;
  const buttonProps = getActionSizeProps(appearance?.actionSize ?? BASE_APPEARANCE.actionSize);
  switch (style) {
    case ACTION_STYLE.SUBTLE:
      return { variant: 'subtle', size: 'compact-sm' };
    case ACTION_STYLE.DEFAULT:
    case ACTION_STYLE.FOOTER:
      return { ...buttonProps, variant: 'default' };
    case ACTION_STYLE.MUTED:
      return { ...buttonProps, variant: 'muted' };
  }
};

export const hasActionFooter = (style: ActionStyle) => {
  switch (style) {
    case ACTION_STYLE.FOOTER:
      return true;
    case ACTION_STYLE.SUBTLE:
    case ACTION_STYLE.DEFAULT:
    case ACTION_STYLE.MUTED:
      return false;
  }
};

export const hasHeaderAlignment = (alignment: ContentAlignment) => {
  switch (alignment) {
    case CONTENT_ALIGNMENT.HEADER:
      return true;
    case CONTENT_ALIGNMENT.TOP:
    case CONTENT_ALIGNMENT.SIMPLE_CENTER:
      return false;
  }
};

export const shouldCenterContent = (
  alignment: ContentAlignment,
  hasDescription: boolean,
  hasActions: boolean,
) => {
  switch (alignment) {
    case CONTENT_ALIGNMENT.TOP:
      return false;
    case CONTENT_ALIGNMENT.SIMPLE_CENTER:
      return !hasDescription && !hasActions;
    case CONTENT_ALIGNMENT.HEADER:
      return true;
  }
};
