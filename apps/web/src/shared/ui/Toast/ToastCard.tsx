import {
  ActionIcon,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core';
import { XIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { FEEDBACK_TONE, getToneColor } from '@/shared/lib/feedback';
import { Toasts } from '@/shared/lib/toasts/store';
import {
  TOAST_CLOSE_REASON,
  TOAST_KIND,
  TOAST_PAUSE,
  type ToastEntry,
} from '@/shared/lib/toasts/models';
import { getToastIcon } from './lib';
import useToastVisibility from './hooks/useToastVisibility';
import styles from './Toast.module.scss';

type Props = { entry: ToastEntry };

function ToastCard({ entry }: Props) {
  const { t } = useTranslation();
  const ref = useToastVisibility(entry.id);
  const color = getToneColor(entry.tone);
  const centered = !entry.description && !entry.actions;

  return (
    <Paper
      ref={ref}
      withBorder
      shadow="md"
      radius="md"
      p={16}
      pos="relative"
      className={styles.card}
      data-toast-id={entry.id}
      style={{ '--toast-tone': `var(--mantine-color-${color}-filled)` }}
      onMouseEnter={() => Toasts.pause(entry.id, TOAST_PAUSE.HOVER, true)}
      onMouseLeave={() => Toasts.pause(entry.id, TOAST_PAUSE.HOVER, false)}
      onFocusCapture={() => Toasts.pause(entry.id, TOAST_PAUSE.FOCUS, true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          Toasts.pause(entry.id, TOAST_PAUSE.FOCUS, false);
      }}
    >
      {entry.onOpen && (
        <UnstyledButton
          pos="absolute"
          inset={0}
          className={styles.eventTarget}
          aria-label={`${t('openNotification')}: ${entry.title}`}
          onClick={() => Toasts.act(entry.id, entry.onOpen!)}
        />
      )}
      <Group gap="xs" wrap="nowrap" align={centered ? 'center' : 'flex-start'}>
        <ThemeIcon variant="muted" color={color} size={32} radius="md" flex="none" aria-hidden>
          {entry.icon ?? getToastIcon(entry.tone)}
        </ThemeIcon>
        <Stack gap={4} flex={1} miw={0}>
          <Text fz="sm" fw={600} lh={1.45}>
            {entry.title}
          </Text>
          {entry.description && (
            <Text fz="sm" c="dimmed" lh={1.45}>
              {entry.description}
            </Text>
          )}
        </Stack>
        <ActionIcon
          pos="relative"
          className={styles.interactive}
          variant="subtle"
          color="gray"
          size={28}
          flex="none"
          aria-label={t('close')}
          onClick={() => Toasts.close(entry.id, TOAST_CLOSE_REASON.DISMISS)}
        >
          <XIcon size={16} />
        </ActionIcon>
      </Group>
      {entry.actions && (
        <Stack gap="sm" mt="sm" pos="relative" className={styles.interactive}>
          <Divider />
          <Group justify="flex-end">{entry.actions}</Group>
        </Stack>
      )}
      {/* Действия не входят в live-region: повтор очереди не зачитывает кнопки как новое событие. */}
      <VisuallyHidden
        role={
          entry.tone === FEEDBACK_TONE.DANGER || entry.kind === TOAST_KIND.SECURITY
            ? 'alert'
            : 'status'
        }
        aria-live={
          entry.tone === FEEDBACK_TONE.DANGER || entry.kind === TOAST_KIND.SECURITY
            ? 'assertive'
            : 'polite'
        }
        aria-atomic="true"
      >
        {entry.title}
        {typeof entry.description === 'string' ? `: ${entry.description}` : ''}
      </VisuallyHidden>
    </Paper>
  );
}

export default ToastCard;
