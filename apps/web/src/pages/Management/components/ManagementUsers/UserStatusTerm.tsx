import { Text } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { USER_STATUS, type ManagedUser } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';

type Props = {
  user: ManagedUser;
};

const MONO = { mono: <Text span inherit ff="monospace" /> };

/** Срок под бейджем статуса: до какого числа блокировка или когда удалится аккаунт. Слово —
 *  обычным шрифтом, дата — моноширинным. */
function UserStatusTerm({ user }: Props) {
  const { t } = useTranslation();
  const { formatDateNumeric } = useDateFormat();

  if (user.status === USER_STATUS.BLOCKED) {
    return (
      <Text fz="xs" c="dimmed">
        {user.blockedUntil ? (
          <Trans
            i18nKey="untilDate"
            values={{ date: formatDateNumeric(user.blockedUntil) }}
            components={MONO}
          />
        ) : (
          t('forever')
        )}
      </Text>
    );
  }

  if (user.status === USER_STATUS.DELETION_SCHEDULED && user.deletionScheduledAt) {
    return (
      <Text fz="xs" c="dimmed">
        <Trans
          i18nKey="deletesOnDate"
          values={{ date: formatDateNumeric(user.deletionScheduledAt) }}
          components={MONO}
        />
      </Text>
    );
  }

  return null;
}

export default UserStatusTerm;
