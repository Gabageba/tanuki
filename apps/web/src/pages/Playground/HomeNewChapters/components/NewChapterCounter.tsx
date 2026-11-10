import { Badge, Group, Text } from '@mantine/core';
import { BookOpenIcon } from '@phosphor-icons/react';
import { CARD_VARIANT, type CounterVariant } from '../models';

type Props = { count: number; variant: CounterVariant };

// Бейджи занимают ту же высоту строки, что и исходный текст: размер карточки сохраняется.
const BADGE_PROPS = {
  variant: 'muted',
  ff: 'monospace',
  fz: 'sm',
  fw: 400,
  lh: 'tight',
  h: '1lh',
  px: 4,
  flex: 'none',
  tt: 'none',
  style: { letterSpacing: 'normal' },
} as const;

function NewChapterCounter({ count, variant }: Props) {
  switch (variant) {
    case CARD_VARIANT.SOFT_ACCENT:
      return (
        <Text
          fz="sm"
          fw={400}
          ff="monospace"
          c="var(--mantine-primary-color-filled)"
          lh="tight"
          flex="none"
        >
          +{count}&nbsp;гл.
        </Text>
      );
    case CARD_VARIANT.DIMMED:
      return (
        <Text fz="sm" fw={400} ff="monospace" c="dimmed" lh="tight" flex="none">
          +{count}&nbsp;гл.
        </Text>
      );
    case CARD_VARIANT.BADGE:
      return (
        <Badge {...BADGE_PROPS} color="gray" radius="sm">
          +{count}&nbsp;гл.
        </Badge>
      );
    case CARD_VARIANT.ICON_BADGE:
      return (
        <Badge {...BADGE_PROPS} radius="xl" leftSection={<BookOpenIcon size={14} />}>
          +{count}&nbsp;гл.
        </Badge>
      );
    case CARD_VARIANT.NUMBER_BADGE:
      return (
        <Group gap={4} wrap="nowrap" flex="none" c="dimmed">
          <Badge {...BADGE_PROPS} color="gray" radius="sm">
            +{count}
          </Badge>
          <Text fz="sm" ff="monospace" lh="tight">
            гл.
          </Text>
        </Group>
      );
  }
}

export default NewChapterCounter;
