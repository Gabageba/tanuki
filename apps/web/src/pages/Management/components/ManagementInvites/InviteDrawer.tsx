import { Button, Divider, Drawer, Stack, Text, useMatches } from '@mantine/core';
import { ArrowsClockwiseIcon, XIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Invite, InvitePermissions } from '@tanuki/contracts';
import InviteFields from './InviteFields';
import { getInviteDrawerTitle } from './models';

type Props = {
  invite: Invite | null;
  /** Приглашение выпустил смотрящий. */
  isOwn: boolean;
  permissions: InvitePermissions | null;
  /** Перевыпуск идёт сразу, без модалки, — крутилка на самой кнопке. */
  isReissuing: boolean;
  onRevoke: (invite: Invite) => void;
  onReissue: (invite: Invite) => void;
  onClose: () => void;
};

/** Карточка приглашения: в заголовке — от кого, ниже поля, действия кнопками внизу. Справа, на
 *  телефоне — снизу. */
function InviteDrawer({
  invite,
  isOwn,
  permissions,
  isReissuing,
  onRevoke,
  onReissue,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const position = useMatches<'bottom' | 'right'>({ base: 'bottom', sm: 'right' });

  const hasActions = permissions !== null && (permissions.canRevoke || permissions.canReissue);

  return (
    <Drawer
      opened={invite !== null}
      onClose={onClose}
      position={position}
      size={position === 'bottom' ? 'auto' : 420}
      title={invite ? getInviteDrawerTitle(invite, isOwn, t) : t('invite')}
    >
      {invite && (
        <Stack gap="md">
          <InviteFields invite={invite} />

          {hasActions && (
            <>
              <Divider />
              <Stack gap="xs">
                {permissions.canReissue && (
                  <>
                    <Button
                      variant="default"
                      leftSection={<ArrowsClockwiseIcon />}
                      loading={isReissuing}
                      onClick={() => onReissue(invite)}
                    >
                      {t('reissue')}
                    </Button>
                    <Text c="dimmed" fz={13}>
                      {t('lostLinkReissue')}
                    </Text>
                  </>
                )}
                {permissions.canRevoke && (
                  <Button
                    variant="muted"
                    color="red"
                    leftSection={<XIcon />}
                    onClick={() => onRevoke(invite)}
                  >
                    {t('revoke')}
                  </Button>
                )}
              </Stack>
            </>
          )}
        </Stack>
      )}
    </Drawer>
  );
}

export default InviteDrawer;
