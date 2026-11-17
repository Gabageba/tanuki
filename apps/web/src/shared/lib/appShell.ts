import type { AppShellProps } from '@mantine/core';

export const HEADER_HEIGHT = 56;
// В ряду высотой 56px у кнопок уже есть около 10px снизу. Safe area дополняет
// этот отступ до безопасного минимума, а не прибавляется к нему целиком.
export const FOOTER_SAFE_AREA_PADDING = 'max(0px, calc(env(safe-area-inset-bottom, 0px) - 10px))';

/** Размеры шапки и нижней панели приложения. От них AppShell задаёт `--app-shell-*-height`:
 *  на них опираются drawer'ы, поэтому те же размеры нужны и вне каркаса — в Storybook. */
export const APP_SHELL_HEADER = {
  height: `calc(${HEADER_HEIGHT}px + env(safe-area-inset-top, 0px))`,
} satisfies AppShellProps['header'];
// Safe area входит и в высоту панели, и в отступ контента и drawer'ов над ней.
export const APP_SHELL_FOOTER = {
  height: { base: `calc(${HEADER_HEIGHT}px + ${FOOTER_SAFE_AREA_PADDING})`, md: 0 },
} satisfies AppShellProps['footer'];
