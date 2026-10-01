import { ActionIcon, ThemeIcon, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { Source } from '@tanuki/contracts';
import { getSourceLoginMark, getSourceLoginMarkColor, getSourceLoginMarkLabel } from '../../lib';
import { getSourceLoginMarkIcon } from './lib';
import { BADGE_ICON_SIZE, BADGE_SIZE } from './models';

type Props = {
  source: Source;
  /** С адресом пометка становится ссылкой — туда, где можно войти. */
  to?: string;
};

/** Пометка о входе — иконка в muted-плашке; полный текст в подсказке, на телефоне — в легенде. */
function SourceLoginBadge({ source, to }: Props) {
  const { t } = useTranslation();
  const mark = getSourceLoginMark(source);

  if (!mark) return null;

  const color = getSourceLoginMarkColor(mark);
  const label = getSourceLoginMarkLabel(mark, t);
  const icon = getSourceLoginMarkIcon(mark, BADGE_ICON_SIZE);

  return (
    <Tooltip label={label}>
      {to ? (
        <ActionIcon
          component={Link}
          to={to}
          variant="muted"
          color={color}
          size={BADGE_SIZE}
          radius="sm"
          flex="none"
          aria-label={label}
        >
          {icon}
        </ActionIcon>
      ) : (
        <ThemeIcon
          variant="muted"
          color={color}
          size={BADGE_SIZE}
          radius="sm"
          flex="none"
          role="img"
          aria-label={label}
        >
          {icon}
        </ThemeIcon>
      )}
    </Tooltip>
  );
}

export default SourceLoginBadge;
