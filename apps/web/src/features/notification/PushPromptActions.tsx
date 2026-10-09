import { Button, Group, Text } from '@mantine/core';
import { BellRingingIcon, CheckIcon, ClockIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { PUSH_DEVICE_STATE, type PushDeviceState } from '@/entities/notification/models';
import { PRIMARY_COLOR } from '@/shared/lib/palette';

type Props = {
  state: PushDeviceState;
  isLoading: boolean;
  onEnable: () => void;
  onDismiss: () => void;
};

/** Кнопки предложения. Если браузер запретил уведомления, вместо «Включить» — подсказка. */
function PushPromptActions({ state, isLoading, onEnable, onDismiss }: Props) {
  const { t } = useTranslation();

  if (state === PUSH_DEVICE_STATE.DENIED) {
    return (
      <Group gap="sm">
        <Text fz="xs" c="dimmed" lh="tight">
          {t('allowNotificationsInBrowserSettings')}
        </Text>
        <Button size="xs" variant="default" leftSection={<CheckIcon />} onClick={onDismiss}>
          {t('gotIt')}
        </Button>
      </Group>
    );
  }

  return (
    <Group gap="xs" wrap="nowrap" grow>
      <Button size="xs" leftSection={<BellRingingIcon />} loading={isLoading} onClick={onEnable}>
        {t('enablePush')}
      </Button>
      <Button
        size="xs"
        variant="subtle"
        color={PRIMARY_COLOR}
        leftSection={<ClockIcon />}
        onClick={onDismiss}
      >
        {t('notNow')}
      </Button>
    </Group>
  );
}

export default PushPromptActions;
