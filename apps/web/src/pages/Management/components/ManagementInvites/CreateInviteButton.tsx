import { useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CheckCircleIcon, CheckIcon, PlusIcon, TicketIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import {
  INVITABLE_ROLE,
  USER_ROLE,
  type CreateInviteResponse,
  type InvitableRole,
} from '@tanuki/contracts';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import InviteCreatedContent from './InviteCreatedContent';
import RoleRadioCards from './RoleRadioCards';
import useCreateInvite from './hooks/useCreateInvite';
import { INVITE_TTL_DAYS } from './models';

type FormValues = {
  role: InvitableRole;
};

/** «Создать приглашение» в шапке вкладки: роль карточками, после создания — ссылка в том же окне. */
function CreateInviteButton() {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const createInvite = useCreateInvite();
  const [opened, setOpened] = useState(false);
  const [created, setCreated] = useState<CreateInviteResponse | null>(null);
  const form = useForm<FormValues>({ initialValues: { role: USER_ROLE.USER } });

  // Модератор может выпускать инвайты только роли USER — MODERATOR доступен лишь админу.
  const availableRoles = Object.values(INVITABLE_ROLE).filter(
    (value) => currentUser?.role === USER_ROLE.ADMIN || value === USER_ROLE.USER,
  );

  const handleClose = () => {
    setOpened(false);
    setCreated(null);
    form.reset();
  };

  const handleCreateAnother = () => {
    setCreated(null);
    form.reset();
  };

  const handleSubmit = form.onSubmit(({ role }) => {
    createInvite.mutate({ role }, { onSuccess: setCreated });
  });

  return (
    <>
      <Button leftSection={<PlusIcon />} onClick={() => setOpened(true)}>
        {t('createInvite')}
      </Button>

      <ToneModal
        tone={created ? MODAL_TONE.SUCCESS : MODAL_TONE.NEUTRAL}
        icon={created ? CheckCircleIcon : TicketIcon}
        opened={opened}
        onClose={handleClose}
        title={created ? t('inviteCreated') : t('newInvite')}
      >
        {created ? (
          <Stack gap="md">
            <InviteCreatedContent invite={created} />
            <ModalButtonsLayout>
              <Button variant="default" leftSection={<PlusIcon />} onClick={handleCreateAnother}>
                {t('oneMore')}
              </Button>
              <Button leftSection={<CheckIcon />} onClick={handleClose}>
                {t('done')}
              </Button>
            </ModalButtonsLayout>
          </Stack>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Stack gap={6}>
                <Text fz="sm">{t('inviteIsOneTimeRegistrationLink')}</Text>
                <Text c="dimmed" fz={13}>
                  {t('validForCountDaysOnePerson', { count: INVITE_TTL_DAYS })}
                </Text>
              </Stack>
              <RoleRadioCards
                roles={availableRoles}
                value={form.values.role}
                onChange={(role) => form.setFieldValue('role', role)}
              />
              <ModalButtonsLayout>
                <Button variant="default" onClick={handleClose}>
                  {t('cancel')}
                </Button>
                <Button type="submit" leftSection={<PlusIcon />} loading={createInvite.isPending}>
                  {t('create')}
                </Button>
              </ModalButtonsLayout>
            </Stack>
          </form>
        )}
      </ToneModal>
    </>
  );
}

export default CreateInviteButton;
