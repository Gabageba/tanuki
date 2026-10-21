import type { AppShellProps } from '@mantine/core';

export const HEADER_HEIGHT = 56;

/** Размеры шапки и нижней панели приложения. От них AppShell задаёт `--app-shell-*-height`:
 *  на них опираются drawer'ы, поэтому те же размеры нужны и вне каркаса — в Storybook. */
export const APP_SHELL_HEADER: AppShellProps['header'] = { height: HEADER_HEIGHT };
export const APP_SHELL_FOOTER: AppShellProps['footer'] = { height: { base: HEADER_HEIGHT, md: 0 } };
