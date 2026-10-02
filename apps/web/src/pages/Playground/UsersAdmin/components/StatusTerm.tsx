import { Text } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { USER_STATUS, type MockUser } from '../models';

type Props = {
  user: MockUser;
};

/** Срок под бейджем статуса: до какого числа блокировка или когда удалится аккаунт. Слово —
 *  обычным шрифтом, дата — моноширинным. */
function StatusTerm({ user }: Props) {
  const { formatDateNumeric } = useDateFormat();

  if (user.status === USER_STATUS.BLOCKED) {
    return (
      <Text fz="xs" c="dimmed">
        {user.blockedUntil ? (
          <>
            до{' '}
            <Text span inherit ff="monospace">
              {formatDateNumeric(user.blockedUntil)}
            </Text>
          </>
        ) : (
          'навсегда'
        )}
      </Text>
    );
  }

  if (user.status === USER_STATUS.DELETION_SCHEDULED && user.deletionScheduledAt) {
    return (
      <Text fz="xs" c="dimmed">
        удалится{' '}
        <Text span inherit ff="monospace">
          {formatDateNumeric(user.deletionScheduledAt)}
        </Text>
      </Text>
    );
  }

  return null;
}

export default StatusTerm;
