import type { ReactNode } from 'react';
import {
  ActionIcon,
  Box,
  Divider,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { ArrowUpRightIcon, XIcon } from '@phosphor-icons/react';
import { getToneColor } from '@/entities/notification/lib';
import {
  BASE_APPEARANCE,
  EVENT_HINT,
  TOAST_KIND,
  type ToastAppearance,
  type ToastSample,
} from '../models';
import {
  getPadding,
  getTitleWeight,
  hasActionFooter,
  hasHeaderAlignment,
  hasStripe,
  isAdaptive,
  shouldCenterContent,
} from '../lib';
import styles from '../GlobalToasts.module.scss';

type Props = {
  item: ToastSample;
  appearance?: Partial<ToastAppearance>;
  actions?: ReactNode;
  onDismiss: () => void;
  onOpen?: () => void;
  animate?: boolean;
};

function ToastCard({ item, appearance, actions, onDismiss, onOpen, animate = false }: Props) {
  const settings = { ...BASE_APPEARANCE, ...appearance };
  const color = getToneColor(item.tone);
  const headerAligned = hasHeaderAlignment(settings.contentAlignment);
  const centered = shouldCenterContent(
    settings.contentAlignment,
    Boolean(item.description),
    Boolean(actions),
  );
  const footer = hasActionFooter(settings.actionStyle);
  const inline = isAdaptive(settings.actionLayout) && !item.description;
  const getEventHint = () => {
    switch (settings.eventHint) {
      case EVENT_HINT.HOVER:
        return null;
      case EVENT_HINT.ARROW:
        return (
          <Box c="dimmed" pt={centered ? 0 : 6} flex="none" className={styles.hint}>
            <ArrowUpRightIcon size={16} />
          </Box>
        );
    }
  };

  return (
    <Paper
      withBorder
      shadow="md"
      radius="md"
      p={getPadding(settings.density)}
      pos="relative"
      data-stripe={hasStripe(settings.accent) || undefined}
      data-toast-id={item.id}
      className={`${styles.card} ${animate ? styles.enter : ''}`}
      style={{ '--toast-tone': `var(--mantine-color-${color}-filled)` }}
    >
      {onOpen && item.kind === TOAST_KIND.EVENT && (
        <UnstyledButton
          pos="absolute"
          inset={0}
          className={styles.eventTarget}
          aria-label={`Открыть: ${item.title}`}
          onClick={onOpen}
        />
      )}
      <Group
        gap="xs"
        wrap="nowrap"
        align={centered ? 'center' : 'flex-start'}
        className={styles.row}
        data-header={headerAligned || undefined}
        data-has-hint={settings.eventHint === EVENT_HINT.ARROW && onOpen ? true : undefined}
      >
        <ThemeIcon
          variant="muted"
          color={color}
          size={32}
          radius="md"
          flex="none"
          className={styles.icon}
        >
          {item.icon}
        </ThemeIcon>
        <Flex
          className={styles.body}
          flex={1}
          miw={0}
          gap="xs"
          wrap="wrap"
          align={inline ? 'center' : 'stretch'}
          direction={inline ? 'row' : 'column'}
        >
          <Stack
            className={styles.textStack}
            gap={4}
            flex={inline ? '1 1 120px' : undefined}
            w={inline ? undefined : '100%'}
            miw={0}
          >
            <Text
              className={styles.title}
              miw={0}
              fz="sm"
              fw={getTitleWeight(settings.titleWeight, settings.density, Boolean(item.description))}
              lh={1.45}
            >
              {item.title}
            </Text>
            {item.description && (
              <Text className={styles.description} miw={0} fz="sm" c="dimmed" lh={1.45}>
                {item.description}
              </Text>
            )}
          </Stack>
          {actions && !footer && (
            <Box
              className={`${styles.interactive} ${styles.actions}`}
              w={inline ? undefined : '100%'}
            >
              {actions}
            </Box>
          )}
        </Flex>
        {onOpen && getEventHint()}
        <ActionIcon
          className={`${styles.interactive} ${styles.dismiss}`}
          variant="subtle"
          color="gray"
          size={28}
          aria-label={`Закрыть: ${item.title}`}
          onClick={onDismiss}
          flex="none"
        >
          <XIcon size={16} />
        </ActionIcon>
      </Group>
      {actions && footer && (
        <Stack gap="sm" mt="sm" className={styles.interactive}>
          <Divider />
          <Group justify="flex-end">{actions}</Group>
        </Stack>
      )}
    </Paper>
  );
}

export default ToastCard;
