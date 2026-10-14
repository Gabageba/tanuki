import { Anchor, Button, Group, Text } from '@mantine/core';
import { CloudSlashIcon, TrayArrowDownIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import {
  getMutedBackground,
  getMutedBorderColor,
  STATUS_DEGRADED_COLOR,
} from '@/shared/lib/palette';
import { OFFLINE_SIGNAL, type OfflineSignal } from '../models';

type Props = {
  /** N2 — бледное золото, N5 — насыщеннее с линией, N6 — нейтральный слой, N14 — фон шапки и
   *  акцентные иконка и ссылка, N2a — фон N2, обычный текст и кнопка muted, N2b–N2d — то же со
   *  ссылкой золотом, акцентом и цветом текста. */
  signal: OfflineSignal;
};

const GOLD_TEXT = `var(--mantine-color-${STATUS_DEGRADED_COLOR}-text)`;
const GOLD_FILLED = `var(--mantine-color-${STATUS_DEGRADED_COLOR}-filled)`;

/** Полоса «Нет сети» под шапкой во всю ширину. */
function OfflineStrip({ signal }: Props) {
  const isStrong = signal === OFFLINE_SIGNAL.STRIP_STRONG;
  const isNeutral = signal === OFFLINE_SIGNAL.STRIP_NEUTRAL;
  // N14 — как N6, но фон как у шапки, иконка и ссылка — акцентом.
  const isHeaderTone = signal === OFFLINE_SIGNAL.STRIP_HEADER;
  // N2a — фон N2, текст обычного цвета, «Загрузки» — кнопка muted.
  const isButton = signal === OFFLINE_SIGNAL.STRIP_BUTTON;
  // N2b–N2d — как N2a, но «Загрузки» — ссылка со значком.
  const isLinkGold = signal === OFFLINE_SIGNAL.STRIP_LINK_GOLD;
  const isLinkAccent = signal === OFFLINE_SIGNAL.STRIP_LINK_ACCENT;
  const isLinkText = signal === OFFLINE_SIGNAL.STRIP_LINK_TEXT;
  const isLink = isLinkGold || isLinkAccent || isLinkText;
  const isLegacy = !isStrong && !isNeutral && !isHeaderTone && !isButton && !isLink;

  const getBackground = () => {
    if (isNeutral) return 'var(--mantine-color-default)';
    if (isHeaderTone) return 'var(--mantine-color-body)';
    return getMutedBackground(STATUS_DEGRADED_COLOR, isStrong);
  };

  const getIconColor = () => {
    if (isHeaderTone) return 'var(--mantine-primary-color-filled)';
    return isLegacy ? undefined : GOLD_FILLED;
  };

  const getLinkColor = () => {
    if (isLinkAccent) return 'var(--mantine-primary-color-filled)';
    if (isLinkText) return 'var(--mantine-color-text)';
    if (isNeutral || isHeaderTone) return undefined;
    return GOLD_TEXT;
  };

  return (
    <Group
      gap="xs"
      px="md"
      py={6}
      wrap="nowrap"
      bg={getBackground()}
      c={isLegacy ? GOLD_TEXT : undefined}
      style={
        isLegacy || isButton || isLink
          ? undefined
          : {
              borderBottom: `1px solid ${
                isStrong
                  ? getMutedBorderColor(STATUS_DEGRADED_COLOR, true)
                  : 'var(--mantine-color-default-border)'
              }`,
            }
      }
    >
      <CloudSlashIcon size={16} color={getIconColor()} style={{ flex: 'none' }} />
      <Text fz="sm" flex={1} c="inherit" truncate="end">
        Нет сети — доступно скачанное
      </Text>
      {isButton ? (
        <Button
          component={Link}
          to="#"
          variant="muted"
          color={STATUS_DEGRADED_COLOR}
          size="compact-sm"
          flex="none"
          leftSection={<TrayArrowDownIcon />}
        >
          Загрузки
        </Button>
      ) : (
        <Anchor
          component={Link}
          to="#"
          fz="sm"
          fw={600}
          flex="none"
          c={getLinkColor()}
          underline={isLinkText ? 'always' : undefined}
        >
          {isLink ? (
            <Group gap={4} wrap="nowrap" component="span">
              <TrayArrowDownIcon size={16} />
              Загрузки
            </Group>
          ) : (
            'Загрузки'
          )}
        </Anchor>
      )}
    </Group>
  );
}

export default OfflineStrip;
