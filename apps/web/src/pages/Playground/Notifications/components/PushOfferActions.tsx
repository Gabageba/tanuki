import { Button, Group, Text } from '@mantine/core';
import { BellRingingIcon, CheckIcon, ClockIcon } from '@phosphor-icons/react';
import { PUSH_OFFER_STATE, type PushOfferState } from '../models';

type Props = {
  state: PushOfferState;
  onDismiss: () => void;
  size?: 'xs' | 'sm';
  enableLabel?: string;
  /** Кнопки делят ширину поровну. */
  isFull?: boolean;
};

/** Кнопки предложения. Если браузер запретил уведомления, вместо «Включить» — подсказка. */
function PushOfferActions({
  state,
  onDismiss,
  size = 'sm',
  enableLabel = 'Включить push-уведомления',
  isFull = false,
}: Props) {
  if (state === PUSH_OFFER_STATE.DENIED) {
    return (
      <Group gap="sm" wrap="wrap">
        <Text fz={12} c="dimmed">
          Разрешите уведомления в настройках браузера
        </Text>
        <Button size={size} variant="default" leftSection={<CheckIcon />} onClick={onDismiss}>
          Понятно
        </Button>
      </Group>
    );
  }

  return (
    <Group gap="xs" wrap={isFull ? 'nowrap' : 'wrap'} grow={isFull}>
      <Button size={size} leftSection={<BellRingingIcon />}>
        {enableLabel}
      </Button>
      <Button
        size={size}
        variant="subtle"
        color="gray"
        leftSection={<ClockIcon />}
        onClick={onDismiss}
      >
        Не сейчас
      </Button>
    </Group>
  );
}

export default PushOfferActions;
