import { Badge } from '@mantine/core';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { SOURCE_ACCESS, SOURCE_LOGIN_REQUIREMENT, type Source } from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import { getSourceAccessLabel, getSourceLoginRequirementLabel } from '../lib';

type Props = {
  source: Source;
  /** С адресом пометка становится ссылкой — туда, где можно войти. */
  to?: string;
};

/** Истёкшая сессия важнее требования: войти заново нужно при любом из них. */
const getSourceLoginBadge = ({ access, loginRequirement }: Source, t: TFunction) => {
  if (access === SOURCE_ACCESS.RELOGIN_REQUIRED) {
    return { color: STATUS_DEGRADED_COLOR, label: getSourceAccessLabel(access, t) };
  }
  if (!loginRequirement) return null;
  return {
    color: loginRequirement === SOURCE_LOGIN_REQUIREMENT.REQUIRED ? 'red' : 'gray',
    label: getSourceLoginRequirementLabel(loginRequirement, t),
  };
};

function SourceLoginBadge({ source, to }: Props) {
  const { t } = useTranslation();
  const badge = getSourceLoginBadge(source, t);

  if (!badge) return null;

  if (to) {
    return (
      // Mantine keeps the default cursor on a badge even when it is a link.
      <Badge
        component={Link}
        to={to}
        variant="muted"
        color={badge.color}
        size="xs"
        flex="none"
        style={{ cursor: 'pointer' }}
      >
        {badge.label}
      </Badge>
    );
  }

  return (
    <Badge variant="muted" color={badge.color} size="xs" flex="none">
      {badge.label}
    </Badge>
  );
}

export default SourceLoginBadge;
