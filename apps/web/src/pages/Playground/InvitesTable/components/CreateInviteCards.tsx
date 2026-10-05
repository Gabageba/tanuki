import { useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CheckCircleIcon, CheckIcon, PlusIcon, TicketIcon } from '@phosphor-icons/react';
import { USER_ROLE, type InvitableRole } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { getInvitableRoles } from '../lib';
import {
  INVITE_TTL_DAYS,
  MESSAGE_PATTERN,
  MESSAGE_TONE,
  type MessagePattern,
  type MockInvite,
  type Viewer,
} from '../models';
import InviteCreatedContent from './InviteCreatedContent';
import ModalMessage from './ModalMessage';
import RoleRadioCards from './RoleRadioCards';
import PatternModal from './PatternModal';

type FormValues = {
  role: InvitableRole;
};

type Props = {
  viewer: Viewer;
  isLinkStored?: boolean;
  pattern?: MessagePattern;
  onCreate: (role: InvitableRole) => MockInvite;
};

/** C1: роль карточками с описанием прав, после создания — ссылка в том же окне. */
function CreateInviteCards({
  viewer,
  isLinkStored = false,
  pattern = MESSAGE_PATTERN.CURRENT,
  onCreate,
}: Props) {
  const [opened, setOpened] = useState(false);
  const [created, setCreated] = useState<MockInvite | null>(null);
  const form = useForm<FormValues>({ initialValues: { role: USER_ROLE.USER } });

  const handleClose = () => {
    setOpened(false);
    setCreated(null);
    form.reset();
  };

  const handleCreateAnother = () => {
    setCreated(null);
    form.reset();
  };

  const handleSubmit = form.onSubmit(({ role }) => setCreated(onCreate(role)));

  return (
    <>
      <Button leftSection={<PlusIcon />} onClick={() => setOpened(true)}>
        Создать приглашение
      </Button>

      <PatternModal
        pattern={pattern}
        tone={created ? MESSAGE_TONE.SUCCESS : MESSAGE_TONE.NEUTRAL}
        icon={created ? CheckCircleIcon : TicketIcon}
        opened={opened}
        onClose={handleClose}
        title={created ? 'Приглашение создано' : 'Новое приглашение'}
        centered
      >
        {created ? (
          <>
            <InviteCreatedContent invite={created} isLinkStored={isLinkStored} pattern={pattern} />
            <ModalButtonsLayout>
              <Button variant="default" leftSection={<PlusIcon />} onClick={handleCreateAnother}>
                Ещё одно
              </Button>
              <Button leftSection={<CheckIcon />} onClick={handleClose}>
                Готово
              </Button>
            </ModalButtonsLayout>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <ModalMessage
                pattern={pattern}
                tone={MESSAGE_TONE.NEUTRAL}
                icon={TicketIcon}
                main="Приглашение — одноразовая ссылка на регистрацию."
                details={[
                  `Она действует ${INVITE_TTL_DAYS} дней, и зарегистрироваться по ней сможет один человек с выбранной ролью.`,
                ]}
                current={
                  <Text c="dimmed" fz={13}>
                    Приглашение — одноразовая ссылка на регистрацию. Она действует {INVITE_TTL_DAYS}{' '}
                    дней, и зарегистрироваться по ней сможет один человек с выбранной ролью.
                  </Text>
                }
              />
              <RoleRadioCards
                roles={getInvitableRoles(viewer)}
                value={form.values.role}
                onChange={(role) => form.setFieldValue('role', role)}
              />
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
      </PatternModal>
    </>
  );
}

export default CreateInviteCards;
