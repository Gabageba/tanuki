import { useState } from 'react';
import { Button, CopyButton, Modal, Select, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CheckIcon, CopyIcon, PlusIcon, ShieldIcon } from '@phosphor-icons/react';
import { USER_ROLE, type InvitableRole } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { getInvitableRoles, getInviteLink, getRoleLabel } from '../lib';
import { INVITE_TTL_DAYS, type MockInvite, type Viewer } from '../models';
import InviteLinkField from './InviteLinkField';

type FormValues = {
  role: InvitableRole;
};

type Props = {
  viewer: Viewer;
  onCreate: (role: InvitableRole) => MockInvite;
};

const isInvitableRole = (value: string | null): value is InvitableRole =>
  value === USER_ROLE.USER || value === USER_ROLE.MODERATOR;

/** C2: роль списком и строка пояснения; после создания — ссылка и крупная кнопка копирования. */
function CreateInviteCompact({ viewer, onCreate }: Props) {
  const [opened, setOpened] = useState(false);
  const [created, setCreated] = useState<MockInvite | null>(null);
  const form = useForm<FormValues>({ initialValues: { role: USER_ROLE.USER } });
  const roles = getInvitableRoles(viewer);

  const handleClose = () => {
    setOpened(false);
    setCreated(null);
    form.reset();
  };

  const handleSubmit = form.onSubmit(({ role }) => setCreated(onCreate(role)));

  return (
    <>
      <Button leftSection={<PlusIcon />} onClick={() => setOpened(true)}>
        Создать приглашение
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title={created ? 'Приглашение создано' : 'Новое приглашение'}
        centered
      >
        {created ? (
          <Stack gap="md">
            <InviteLinkField code={created.code} withCopy={false} />
            <CopyButton value={getInviteLink(created.code)}>
              {({ copied, copy }) => (
                <Button
                  fullWidth
                  variant={copied ? 'muted' : 'filled'}
                  color={copied ? 'teal' : undefined}
                  leftSection={copied ? <CheckIcon /> : <CopyIcon />}
                  onClick={copy}
                >
                  {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
                </Button>
              )}
            </CopyButton>
            <Text c="dimmed" fz={13}>
              Ссылку мы показываем только сейчас.
            </Text>
            <ModalButtonsLayout>
              <Button variant="default" leftSection={<CheckIcon />} onClick={handleClose}>
                Готово
              </Button>
            </ModalButtonsLayout>
          </Stack>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Text c="dimmed" fz={13}>
                {roles.length > 1
                  ? `Одноразовая ссылка на регистрацию, действует ${INVITE_TTL_DAYS} дней.`
                  : `Одноразовая ссылка на регистрацию с ролью «${getRoleLabel(USER_ROLE.USER)}», действует ${INVITE_TTL_DAYS} дней.`}
              </Text>
              {roles.length > 1 && (
                <Select
                  aria-label="Роль"
                  leftSection={<ShieldIcon />}
                  allowDeselect={false}
                  data={roles.map((value) => ({ value, label: getRoleLabel(value) }))}
                  {...form.getInputProps('role')}
                  onChange={(value) => isInvitableRole(value) && form.setFieldValue('role', value)}
                />
              )}
              <ModalButtonsLayout>
                <Button variant="default" onClick={handleClose}>
                  Отмена
                </Button>
                <Button type="submit" leftSection={<PlusIcon />}>
                  Создать
                </Button>
              </ModalButtonsLayout>
            </Stack>
          </form>
        )}
      </Modal>
    </>
  );
}

export default CreateInviteCompact;
