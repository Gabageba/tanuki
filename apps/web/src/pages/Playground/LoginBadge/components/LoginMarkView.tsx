import { ActionIcon, Badge, Box, Tooltip } from '@mantine/core';
import { getMarkColor, getMarkLabel, getMarkShortLabel } from '../lib';
import { LOGIN_MARK, MARK_VIEW, type LoginMark, type MarkView, type IconSet } from '../models';
import { getMarkIcon } from './lib';
import MutedMarkIcon from './MutedMarkIcon';
import styles from './LoginBadge.module.scss';

type Props = {
  mark: LoginMark;
  view: MarkView;
  iconSet: IconSet;
};

/** Пометка о входе рядом с названием (настройки) или справа в строке (профиль). */
function LoginMarkView({ mark, view, iconSet }: Props) {
  const color = getMarkColor(mark);
  const label = getMarkLabel(mark);
  // Как в S1: «по желанию» тише остальных — контуром, а не заливкой.
  const badgeVariant = mark === LOGIN_MARK.OPTIONAL ? 'outline' : 'muted';

  const icon = (
    <Tooltip label={label}>
      <ActionIcon variant="light" color={color} size="sm" flex="none" aria-label={label}>
        {getMarkIcon(mark, 14, iconSet)}
      </ActionIcon>
    </Tooltip>
  );
  const fullBadge = (
    <Badge variant="muted" color={color} size="xs" flex="none">
      {label}
    </Badge>
  );

  switch (view) {
    case MARK_VIEW.BADGE:
      return fullBadge;
    case MARK_VIEW.ICON:
      return icon;
    case MARK_VIEW.ICON_MUTED:
    case MARK_VIEW.ICON_PILL:
    case MARK_VIEW.ICON_ROUND:
      return <MutedMarkIcon mark={mark} view={view} iconSet={iconSet} />;
    case MARK_VIEW.WORD:
      return (
        <Tooltip label={label}>
          <Badge
            variant={badgeVariant}
            color={color}
            size="xs"
            flex="none"
            leftSection={getMarkIcon(mark, 11, iconSet)}
          >
            Вход
          </Badge>
        </Tooltip>
      );
    case MARK_VIEW.SHORT:
      return (
        <Badge
          variant={badgeVariant}
          color={color}
          size="xs"
          flex="none"
          leftSection={getMarkIcon(mark, 11, iconSet)}
        >
          {getMarkShortLabel(mark)}
        </Badge>
      );
    case MARK_VIEW.ADAPTIVE:
      return (
        <>
          <Box className={styles.full} flex="none" lh={0}>
            {fullBadge}
          </Box>
          <Box className={styles.compact} flex="none" lh={0}>
            {icon}
          </Box>
        </>
      );
    case MARK_VIEW.AVATAR:
      // Пометка на логотипе — её рисует MarkedSourceIcon.
      return null;
  }
}

export default LoginMarkView;
