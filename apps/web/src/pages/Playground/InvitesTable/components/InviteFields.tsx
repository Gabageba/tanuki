import { Stack, Text } from '@mantine/core';
import { INVITE_STATUS } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { formatTimeLeft } from '../lib';
import type { MockInvite } from '../models';
import DrawerField from './DrawerField';
import InviteStatusBadge from './InviteStatusBadge';
import PersonName from './PersonName';
import RoleBadge from './RoleBadge';

type Props = {
  invite: MockInvite;
};

/** D1: поля строками «подпись — значение», как в карточке пользователя. Показываются только
 *  поля, которые у этого статуса есть, — без прочерков в «Использовал» у активного. */
function InviteFields({ invite }: Props) {
  const { formatDateNumeric } = useDateFormat();

  return (
    <Stack gap="sm">
      <DrawerField label="Роль">
        <RoleBadge role={invite.role} />
      </DrawerField>
      <DrawerField label="Статус">
        <InviteStatusBadge status={invite.status} />
        {invite.status === INVITE_STATUS.ACTIVE && (
          <Text fz="xs" c="dimmed">
            {formatTimeLeft(invite.expiresAt)}
          </Text>
        )}
      </DrawerField>
      <DrawerField label="Создал">
        {invite.createdBy ? (
          <PersonName username={invite.createdBy} />
        ) : (
          <Text fz="sm">Консоль</Text>
        )}
      </DrawerField>
      <DrawerField label="Создано">
        <Text fz="sm" ff="monospace">
          {formatDateNumeric(invite.createdAt)}
        </Text>
      </DrawerField>
      {invite.status === INVITE_STATUS.USED ? (
        <>
          <DrawerField label="Использовал">
            <PersonName username={invite.usedBy} withAvatar />
          </DrawerField>
          {invite.usedAt && (
            <DrawerField label="Использовано">
              <Text fz="sm" ff="monospace">
                {formatDateNumeric(invite.usedAt)}
              </Text>
            </DrawerField>
          )}
        </>
      ) : invite.status === INVITE_STATUS.REVOKED ? (
        <>
          <DrawerField label="Отозвал">
            <PersonName username={invite.revokedBy} />
          </DrawerField>
          {invite.revokedAt && (
            <DrawerField label="Отозвано">
              <Text fz="sm" ff="monospace">
                {formatDateNumeric(invite.revokedAt)}
              </Text>
            </DrawerField>
          )}
        </>
      ) : (
        <DrawerField label={invite.status === INVITE_STATUS.ACTIVE ? 'Истекает' : 'Истекло'}>
          <Text fz="sm" ff="monospace">
            {formatDateNumeric(invite.expiresAt)}
          </Text>
        </DrawerField>
      )}
    </Stack>
  );
}

export default InviteFields;
