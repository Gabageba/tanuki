import type { ReactNode } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { Link } from 'react-router';

type Props = {
  to: string;
  label: string;
  /** Своя страница — светлая подложка (H3a); залитую иконку передаёт вызывающий. */
  isActive: boolean;
  /** Иконка, при нужде обёрнутая в индикатор (точка новых глав, непрочитанное). */
  children: ReactNode;
};

/** Иконка-ссылка шапки: главная, закладки, уведомления. Своя страница выделена одинаково у всех. */
function HeaderIconButton({ to, label, isActive, children }: Props) {
  return (
    <Tooltip label={label}>
      <ActionIcon
        component={Link}
        to={to}
        size="lg"
        variant={isActive ? 'light' : 'subtle'}
        color={isActive ? undefined : 'gray'}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        {children}
      </ActionIcon>
    </Tooltip>
  );
}

export default HeaderIconButton;
