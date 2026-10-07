import { Button, Divider, Stack, Text } from '@mantine/core';
import { ArrowsClockwiseIcon, XIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Invite, InvitePermissions } from '@tanuki/contracts';
import ResponsiveDrawer from '@/shared/ui/ResponsiveDrawer';
import { DRAWER_POSITION } from '@/shared/ui/ResponsiveDrawer/models';
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

  const hasActions = permissions !== null && (permissions.canRevoke || permissions.canReissue);

  return (
    <ResponsiveDrawer
      opened={invite !== null}
      onClose={onClose}
      side={DRAWER_POSITION.RIGHT}
      sideSize={420}
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
    </ResponsiveDrawer>
  );
}

export default InviteDrawer;
