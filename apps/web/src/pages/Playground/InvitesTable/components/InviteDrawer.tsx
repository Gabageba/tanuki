import { Button, Divider, Drawer, Group, Stack, Text } from '@mantine/core';
import { ArrowsClockwiseIcon, XIcon } from '@phosphor-icons/react';
import {
  DRAWER_LAYOUT,
  LINK_RECOVERY,
  REVOKE_CONFIRM,
  type MockInvite,
  type PanelConfig,
} from '../models';
import { getInviteDrawerTitle } from '../lib';
import InviteFields from './InviteFields';
import InviteLinkField from './InviteLinkField';
import InviteStatusBadge from './InviteStatusBadge';
import InviteTimeline from './InviteTimeline';
import RevokeTwoStepButton from './RevokeTwoStepButton';
import RoleBadge from './RoleBadge';

type Props = {
  invite: MockInvite | null;
  config: PanelConfig;
  isOwn: boolean;
  /** Активное и смотрящему можно им управлять: админ — любым, модератор — своим. */
  canManage: boolean;
  /** Рамка телефона — карточка снизу, как на узком экране. */
  narrow: boolean;
  onRevokeRequest: (invite: MockInvite) => void;
  onRevoke: (invite: MockInvite) => void;
  onReissue: (invite: MockInvite) => void;
  onClose: () => void;
};

/** Карточка приглашения: в заголовке — от кого, ниже поля (D1) или лента событий (D2), действия — внизу. */
function InviteDrawer({
  invite,
  config,
  isOwn,
  canManage,
  narrow,
  onRevokeRequest,
  onRevoke,
  onReissue,
  onClose,
}: Props) {
  return (
    <Drawer
      opened={invite !== null}
      onClose={onClose}
      position={narrow ? 'bottom' : 'right'}
      size={narrow ? 'auto' : 420}
      title={invite ? getInviteDrawerTitle(invite, isOwn) : 'Приглашение'}
    >
      {invite && (
        <Stack gap="md">
          {config.drawer === DRAWER_LAYOUT.FIELDS ? (
            // D1: роль и статус уже есть в полях — тегов над ними нет.
            <InviteFields invite={invite} />
          ) : (
            <>
              {/* D2: в ленте нет ни роли, ни статуса — они тегами сверху. */}
              <Group gap="xs">
                <RoleBadge role={invite.role} size="lg" />
                <InviteStatusBadge status={invite.status} />
              </Group>
              <Divider />
              <InviteTimeline invite={invite} />
            </>
          )}

          {canManage && (
            <>
              <Divider />
              <Stack gap="xs">
                {config.link === LINK_RECOVERY.STORED ? (
                  <InviteLinkField code={invite.code} />
                ) : (
                  <>
                    <Button
                      variant="default"
                      leftSection={<ArrowsClockwiseIcon />}
                      onClick={() => onReissue(invite)}
                    >
                      Перевыпустить
                    </Button>
                    <Text c="dimmed" fz={13}>
                      Потеряли ссылку? Создадим новую с той же ролью, а эта перестанет работать.
                    </Text>
                  </>
                )}
                {config.revoke === REVOKE_CONFIRM.MODAL ? (
                  <Button
                    variant="muted"
                    color="red"
                    leftSection={<XIcon />}
                    onClick={() => onRevokeRequest(invite)}
                  >
                    Отозвать
                  </Button>
                ) : (
                  <RevokeTwoStepButton key={invite.id} onConfirm={() => onRevoke(invite)} />
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
