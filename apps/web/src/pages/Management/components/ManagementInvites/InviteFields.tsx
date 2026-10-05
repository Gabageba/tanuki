import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { INVITE_STATUS, type Invite } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import DrawerField from '../DrawerField';
import RoleBadge from '../RoleBadge';
import InvitePerson from './InvitePerson';
import InviteStatusBadge from './InviteStatusBadge';
import { getDaysLeft } from './models';

type Props = {
  invite: Invite;
};

/** Поля карточки строками «подпись — значение», как у пользователя. Показываются только поля,
 *  которые у этого статуса есть, — без прочерков в «Использовал» у активного. */
function InviteFields({ invite }: Props) {
  const { t } = useTranslation();
  const { formatDateNumeric } = useDateFormat();

  const dateValue = (date: string) => (
    <Text fz="sm" ff="monospace">
      {formatDateNumeric(date)}
    </Text>
  );
  const daysLeft = getDaysLeft(invite.expiresAt);

  return (
    <Stack gap="sm">
      <DrawerField label={t('role')}>
        <RoleBadge role={invite.role} />
      </DrawerField>
      <DrawerField label={t('status')}>
        <InviteStatusBadge status={invite.status} />
        {invite.status === INVITE_STATUS.ACTIVE && (
          <Text fz="xs" c="dimmed">
            {daysLeft === 0 ? t('expiresToday') : t('countMoreDays', { count: daysLeft })}
          </Text>
        )}
      </DrawerField>
      <DrawerField label={t('createdBy')}>
        {invite.createdByUsername ? (
          <InvitePerson username={invite.createdByUsername} />
        ) : (
          <Text fz="sm">{t('console')}</Text>
        )}
      </DrawerField>
      <DrawerField label={t('created')}>{dateValue(invite.createdAt)}</DrawerField>
      {invite.status === INVITE_STATUS.USED && (
        <>
          <DrawerField label={t('usedBy')}>
            <InvitePerson
              username={invite.usedByUsername}
              avatarUrl={invite.usedByAvatarUrl}
              withAvatar
            />
          </DrawerField>
          {invite.usedAt && <DrawerField label={t('used')}>{dateValue(invite.usedAt)}</DrawerField>}
        </>
      )}
      {invite.status === INVITE_STATUS.REVOKED && (
        <>
          <DrawerField label={t('revokedBy')}>
            <InvitePerson username={invite.revokedByUsername} />
          </DrawerField>
          {invite.revokedAt && (
            <DrawerField label={t('revoked')}>{dateValue(invite.revokedAt)}</DrawerField>
          )}
        </>
      )}
      {invite.status === INVITE_STATUS.ACTIVE && (
        <DrawerField label={t('expires')}>{dateValue(invite.expiresAt)}</DrawerField>
      )}
      {invite.status === INVITE_STATUS.EXPIRED && (
        <DrawerField label={t('expired')}>{dateValue(invite.expiresAt)}</DrawerField>
      )}
    </Stack>
  );
}

export default InviteFields;
