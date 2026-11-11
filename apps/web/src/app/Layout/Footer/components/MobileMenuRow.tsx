import type { ReactNode } from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import { Link } from 'react-router';
import styles from './MobileMenu.module.scss';

type Props = {
  leftSection: ReactNode;
  rightSection?: ReactNode;
  children: ReactNode;
  /** Пункт-ссылка; без неё — кнопка с `onClick`. */
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  isDanger?: boolean;
};

/** Пункт мобильного меню в размерах Menu.Item — 14px, поля 6.67 × 12px, иконка с зазором 10px:
 *  сам `Menu.Item` вне `Menu` не работает. */
function MobileMenuRow({
  leftSection,
  rightSection,
  children,
  to,
  onClick,
  disabled,
  isDanger = false,
}: Props) {
  const rowProps = {
    className: styles.row,
    display: 'flex',
    w: '100%',
    px: 'sm',
    py: 'calc(var(--mantine-spacing-xs) / 1.5)',
    fz: 'sm',
    bdrs: 'var(--mantine-radius-default)',
    // Как у `Menu.Item color="red"`: текст — шестой оттенок, наведение — в MobileMenu.module.scss.
    c: isDanger ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-text)',
    'data-danger': isDanger || undefined,
    style: { alignItems: 'center' },
    onClick,
    children: (
      <>
        <Box display="flex" me="xs">
          {leftSection}
        </Box>
        <Box flex={1}>{children}</Box>
        {rightSection}
      </>
    ),
  };

  if (to !== undefined) {
    return <UnstyledButton component={Link} to={to} {...rowProps} />;
  }

  return <UnstyledButton disabled={disabled} opacity={disabled ? 0.6 : undefined} {...rowProps} />;
}

export default MobileMenuRow;
