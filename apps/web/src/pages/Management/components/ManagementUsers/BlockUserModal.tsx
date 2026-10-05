import { Button, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CalendarBlankIcon, ChatTextIcon, ClockIcon, ProhibitIcon } from '@phosphor-icons/react';
import { Trans, useTranslation } from 'react-i18next';
import {
  BLOCK_REASON_MAX_LENGTH,
  type BlockUserRequest,
  type ManagedUser,
} from '@tanuki/contracts';
import { validateRequired } from '@/shared/lib/authValidation';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import {
  BLOCK_DURATION,
  getBlockDurationLabel,
  getBlockedUntil,
  getToday,
  type BlockDuration,
} from './models';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  user: ManagedUser | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (payload: BlockUserRequest) => void;
};

type FormValues = {
  duration: BlockDuration;
  /** `YYYY-MM-DD` из поля даты; нужна только при сроке «Своя дата». */
  customDate: string;
  reason: string;
};

/** Ключ у родителя — id пользователя, так что при каждом открытии форма начинается заново. */
function BlockUserModal({ user, isPending, onClose, onConfirm }: Props) {
  const { t } = useTranslation();

  const form = useForm<FormValues>({
    initialValues: { duration: BLOCK_DURATION.WEEK, customDate: '', reason: '' },
    validate: {
      customDate: (value, values) =>
        values.duration === BLOCK_DURATION.CUSTOM ? validateRequired(t)(value) : null,
    },
  });

  const isCustom = form.values.duration === BLOCK_DURATION.CUSTOM;

  const handleSubmit = form.onSubmit(({ duration, customDate, reason }) => {
    onConfirm({ until: getBlockedUntil(duration, customDate), reason: reason.trim() || null });
  });

  return (
    <ToneModal
      tone={MODAL_TONE.DANGER}
      icon={ProhibitIcon}
      opened={user !== null}
      onClose={onClose}
      title={t('blocking')}
    >
      {user && (
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Stack gap={6}>
              <Text fz="sm">
                <Trans
                  i18nKey="userCantLogInWhileBlocked"
                  values={{ username: user.username }}
                  components={{ b: <Text span inherit fw={600} /> }}
                />
              </Text>
              <Text c="dimmed" fz={13}>
                {t('reasonIfGivenSeenByStaffAndUser')}
              </Text>
            </Stack>

            <Select
              aria-label={t('period')}
              leftSection={<ClockIcon />}
              data={Object.values(BLOCK_DURATION).map((value) => ({
                value,
                label: getBlockDurationLabel(value, t),
              }))}
              allowDeselect={false}
              {...form.getInputProps('duration')}
            />

            {isCustom && (
              <TextInput
                type="date"
                aria-label={t('untilWhichDate')}
                leftSection={<CalendarBlankIcon />}
                min={getToday()}
                {...form.getInputProps('customDate')}
              />
            )}

            <TextInput
              placeholder={t('reason')}
              leftSection={<ChatTextIcon />}
              maxLength={BLOCK_REASON_MAX_LENGTH}
              {...form.getInputProps('reason')}
            />

            <ModalButtonsLayout>
              <Button variant="default" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button type="submit" color="red" leftSection={<ProhibitIcon />} loading={isPending}>
                {t('block')}
              </Button>
            </ModalButtonsLayout>
          </Stack>
        </form>
      )}
    </ToneModal>
  );
}

export default BlockUserModal;
