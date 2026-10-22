import { use, type CSSProperties } from 'react';
import { Anchor, Group, Text } from '@mantine/core';
import { CloudSlashIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import {
  getMutedBackground,
  getMutedBorderColor,
  STATUS_DEGRADED_COLOR,
} from '@/shared/lib/palette';
import { PHONE_FRAME_CONTEXT } from '../../Notifications/models';
import { ACCENT_TAB_BACKGROUND, ACCENT_TAB_BORDER } from '../lib';
import { OFFLINE_SIGNAL, type OfflineSignal } from '../models';

type Props = {
  /** N9a — золото залитое, N9b — инверсия, N9c (и N9c1–N9c4) — акцентный тон, N9d — язычок по центру. */
  signal: OfflineSignal;
};

type Look = {
  background: string;
  text: string;
  icon: string;
  link: string;
  border?: string;
};

const GOLD_FILLED = `var(--mantine-color-${STATUS_DEGRADED_COLOR}-filled)`;
const GOLD_TEXT = `var(--mantine-color-${STATUS_DEGRADED_COLOR}-text)`;
// Текст на залитом золоте — всегда тёмный: светлый на жёлтом не читается ни в одной теме.
const ON_GOLD = 'var(--mantine-color-dark-9)';

const ACCENT_LOOK: Look = {
  background: ACCENT_TAB_BACKGROUND,
  text: 'var(--mantine-color-text)',
  icon: 'var(--mantine-primary-color-filled)',
  link: 'var(--mantine-primary-color-filled)',
};

const getLook = (signal: OfflineSignal): Look => {
  switch (signal) {
    case OFFLINE_SIGNAL.TAB_GOLD:
      return { background: GOLD_FILLED, text: ON_GOLD, icon: ON_GOLD, link: ON_GOLD };
    case OFFLINE_SIGNAL.TAB_INVERTED:
      return {
        background: 'var(--mantine-color-text)',
        text: 'var(--mantine-color-body)',
        icon: GOLD_FILLED,
        link: 'var(--mantine-color-body)',
      };
    case OFFLINE_SIGNAL.TAB_ACCENT:
    case OFFLINE_SIGNAL.TAB_ACCENT_NO_LINE:
    case OFFLINE_SIGNAL.TAB_ACCENT_LINE:
      return { ...ACCENT_LOOK, border: ACCENT_TAB_BORDER };
    case OFFLINE_SIGNAL.TAB_ACCENT_FILL:
    case OFFLINE_SIGNAL.TAB_ACCENT_HEADER:
      return ACCENT_LOOK;
    case OFFLINE_SIGNAL.TAB_CENTER:
    case OFFLINE_SIGNAL.ICON:
    case OFFLINE_SIGNAL.STRIP:
    case OFFLINE_SIGNAL.TOAST:
    case OFFLINE_SIGNAL.MUTED_HEADER:
    case OFFLINE_SIGNAL.STRIP_STRONG:
    case OFFLINE_SIGNAL.STRIP_NEUTRAL:
    case OFFLINE_SIGNAL.CAPSULE:
    case OFFLINE_SIGNAL.HEADER_BADGE:
    case OFFLINE_SIGNAL.SEARCH:
    case OFFLINE_SIGNAL.DOWNLOADS_BUTTON:
    case OFFLINE_SIGNAL.SNACKBAR:
    case OFFLINE_SIGNAL.AVATAR_STATUS:
    case OFFLINE_SIGNAL.STRIP_HEADER:
    case OFFLINE_SIGNAL.STRIP_BUTTON:
    case OFFLINE_SIGNAL.STRIP_LINK_GOLD:
    case OFFLINE_SIGNAL.STRIP_LINK_ACCENT:
    case OFFLINE_SIGNAL.STRIP_LINK_TEXT:
      return {
        background: getMutedBackground(STATUS_DEGRADED_COLOR, true),
        text: 'var(--mantine-color-text)',
        icon: GOLD_FILLED,
        link: GOLD_TEXT,
        border: getMutedBorderColor(STATUS_DEGRADED_COLOR, true),
      };
  }
};

/** «Нет сети» свисает из шапки: верх примыкает к её линии, нижние углы скруглены. */
function OfflineTab({ signal }: Props) {
  const isPhone = use(PHONE_FRAME_CONTEXT);
  const look = getLook(signal);
  const isCenter = signal === OFFLINE_SIGNAL.TAB_CENTER;

  const style: CSSProperties = {
    borderRadius: '0 0 var(--mantine-radius-md) var(--mantine-radius-md)',
    ...(look.border && { border: `1px solid ${look.border}`, borderTop: 'none' }),
  };

  return (
    <Group
      gap="xs"
      px="md"
      py={6}
      wrap="nowrap"
      bg={look.background}
      w={isCenter ? 'fit-content' : undefined}
      maw="100%"
      mx={isCenter ? 'auto' : undefined}
      style={style}
    >
      <CloudSlashIcon size={16} color={look.icon} style={{ flex: 'none' }} />
      <Text fz="sm" flex={isCenter ? undefined : 1} c={look.text} truncate="end">
        {isCenter && isPhone ? 'Нет сети' : 'Нет сети — доступно скачанное'}
      </Text>
      <Anchor
        component={Link}
        to="#"
        fz="sm"
        fw={600}
        flex="none"
        c={look.link}
        underline={signal === OFFLINE_SIGNAL.TAB_GOLD ? 'always' : undefined}
      >
        Загрузки
      </Anchor>
    </Group>
  );
}

export default OfflineTab;
