import { useState } from 'react';
import { Button, CopyButton, Modal, SegmentedControl, Stack, TextInput } from '@mantine/core';
import { CheckIcon, CopyIcon, PlusIcon } from '@phosphor-icons/react';
import { USER_ROLE, type InvitableRole } from '@tanuki/contracts';
import { getInvitableRoles, getInviteLink, getRoleLabel } from '../lib';
import type { MockInvite, Viewer } from '../models';

type Props = {
  viewer: Viewer;
  onCreate: (role: InvitableRole) => MockInvite;
};

const isInvitableRole = (value: string): value is InvitableRole =>
  value === USER_ROLE.USER || value === USER_ROLE.MODERATOR;

/** C0: нынешняя модалка как есть — переключатель роли, потом поле со ссылкой. */
function CreateInviteCurrent({ viewer, onCreate }: Props) {
  const [opened, setOpened] = useState(false);
  const [role, setRole] = useState<InvitableRole>(USER_ROLE.USER);
  const [created, setCreated] = useState<MockInvite | null>(null);

  const handleClose = () => {
    setOpened(false);
    setCreated(null);
    setRole(USER_ROLE.USER);
  };

  return (
    <>
      <Button leftSection={<PlusIcon size={16} />} onClick={() => setOpened(true)}>
        Создать приглашение
      </Button>

      <Modal opened={opened} onClose={handleClose} title="Создать приглашение" centered>
        {created ? (
          <Stack gap="sm">
            <TextInput value={getInviteLink(created.code)} readOnly ff="monospace" />
            <CopyButton value={getInviteLink(created.code)}>
              {({ copied, copy }) => (
                <Button
                  variant={copied ? 'light' : 'filled'}
                  color={copied ? 'green' : undefined}
                  leftSection={copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                  onClick={copy}
                >
                  {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
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
              onChange={(value) => isInvitableRole(value) && setRole(value)}
              data={getInvitableRoles(viewer).map((value) => ({
                value,
                label: getRoleLabel(value),
              }))}
            />
            <Button leftSection={<PlusIcon size={16} />} onClick={() => setCreated(onCreate(role))}>
              Создать приглашение
            </Button>
          </Stack>
        )}
      </Modal>
    </>
  );
}

export default CreateInviteCurrent;
