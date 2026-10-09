import { ActionIcon, Button, Group, Paper, Text, ThemeIcon } from '@mantine/core';
import { BellRingingIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import { PUSH_OFFER_STATE, type PushOfferState } from '../models';

type Props = {
  state: PushOfferState;
  onDismiss: () => void;
};

/** M2: одна плотная строка — вопрос, «Включить» и «×». */
function PushBannerInline({ state, onDismiss }: Props) {
  const isDenied = state === PUSH_OFFER_STATE.DENIED;

  return (
    <Paper withBorder radius="md" p="xs">
      <Group wrap="nowrap" gap="sm">
        <ThemeIcon variant="muted" color={PRIMARY_COLOR} size={32} radius="md" flex="none">
          <BellRingingIcon size={18} />
        </ThemeIcon>
        <Text fz="sm" flex={1} miw={0} lineClamp={2}>
          {isDenied
            ? 'Разрешите уведомления в настройках браузера'
            : 'Узнавать о новых главах первыми?'}
        </Text>
        {!isDenied && (
          <Button size="xs" leftSection={<BellRingingIcon />} flex="none">
            Включить
          </Button>
        )}
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          flex="none"
          aria-label={isDenied ? 'Понятно' : 'Не сейчас'}
          onClick={onDismiss}
        >
          {isDenied ? <CheckIcon size={14} /> : <XIcon size={14} />}
        </ActionIcon>
      </Group>
    </Paper>
  );
}

export default PushBannerInline;
