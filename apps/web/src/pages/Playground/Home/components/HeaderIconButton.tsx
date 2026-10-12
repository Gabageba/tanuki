import { ActionIcon, Indicator, Tooltip } from '@mantine/core';
import { Link } from 'react-router';
import type { Icon } from '@phosphor-icons/react';
import { HEADER_HIGHLIGHT, type HeaderHighlight } from '../models';
import HeaderNavItem from './HeaderNavItem';

type Props = {
  icon: Icon;
  label: string;
  to: string;
  isActive: boolean;
  highlight: HeaderHighlight;
  /** Точка, как у закладок с новыми главами и колокольчика с непрочитанным. */
  withDot?: boolean;
};

/** Иконка-ссылка шапки (главная, закладки, уведомления) с выделением своей страницы: H3a —
 *  подложка и заливка, H3b — только цвет и заливка, H3c — линия по низу шапки. */
function HeaderIconButton({ icon: IconComponent, label, to, isActive, highlight, withDot }: Props) {
  const isLight = isActive && highlight === HEADER_HIGHLIGHT.LIGHT;
  const button = (
    <Tooltip label={label}>
      <ActionIcon
        component={Link}
        to={to}
        size="lg"
        variant={isLight ? 'light' : 'subtle'}
        color={isActive ? undefined : 'gray'}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        <Indicator size={8} offset={{ x: 5, y: 3 }} disabled={!withDot}>
          <IconComponent size={20} weight={isActive ? 'fill' : 'regular'} />
        </Indicator>
      </ActionIcon>
    </Tooltip>
  );

  if (highlight !== HEADER_HIGHLIGHT.LINE) {
    return button;
  }

  return <HeaderNavItem isActive={isActive}>{button}</HeaderNavItem>;
}

export default HeaderIconButton;
