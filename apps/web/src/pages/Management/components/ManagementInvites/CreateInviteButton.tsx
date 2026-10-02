import { useState } from 'react';
import { Button, CopyButton, Modal, SegmentedControl, Stack, TextInput } from '@mantine/core';
import { CheckIcon, CopyIcon, PlusIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import {
  INVITABLE_ROLE,
  USER_ROLE,
  type CreateInviteResponse,
  type InvitableRole,
} from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { getUserRoleLabel } from '../../models';
import useCreateInvite from './hooks/useCreateInvite';

const inviteLinkOf = (code: string) =>
  `${window.location.origin}${ROUTE_PATHS.REGISTER}?invite=${code}`;

function CreateInviteButton() {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const createInvite = useCreateInvite();
  const [opened, setOpened] = useState(false);
  const [role, setRole] = useState<InvitableRole>(USER_ROLE.USER);
  const [created, setCreated] = useState<CreateInviteResponse | null>(null);

  // Модератор может выпускать инвайты только роли USER — MODERATOR доступен лишь админу.
  const availableRoles = Object.values(INVITABLE_ROLE).filter(
    (value) => currentUser?.role === USER_ROLE.ADMIN || value === USER_ROLE.USER,
  );

  const handleClose = () => {
    setOpened(false);
    setCreated(null);
    setRole(USER_ROLE.USER);
  };

  const handleCreate = () => {
    createInvite.mutate({ role }, { onSuccess: setCreated });
  };

  return (
    <>
      <Button leftSection={<PlusIcon size={16} />} onClick={() => setOpened(true)}>
        {t('createInvite')}
      </Button>

      <Modal opened={opened} onClose={handleClose} title={t('createInvite')} centered>
        {created ? (
          <Stack gap="sm">
            <TextInput value={inviteLinkOf(created.code)} readOnly ff="monospace" />
            <CopyButton value={inviteLinkOf(created.code)}>
              {({ copied, copy }) => (
                <Button
                  variant={copied ? 'light' : 'filled'}
                  color={copied ? 'green' : undefined}
                  leftSection={copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                  onClick={copy}
                >
                  {copied ? t('linkCopied') : t('copyLink')}
                </Button>
              )}
            </CopyButton>
          </Stack>
        ) : (
          <Stack gap="sm">
            <SegmentedControl
              w="100%"
              size="sm"
              value={role}
              onChange={(value) => setRole(value as InvitableRole)}
              data={availableRoles.map((value) => ({
                value,
                label: getUserRoleLabel(value, t),
              }))}
              styles={{
                label: {
                  justifyContent: 'center',
                },
              }}
            />
            <Button
              leftSection={<PlusIcon size={16} />}
              onClick={handleCreate}
              loading={createInvite.isPending}
            >
              {t('createInvite')}
            </Button>
          </Stack>
        )}
      </Modal>
    </>
  );
}

export default CreateInviteButton;
