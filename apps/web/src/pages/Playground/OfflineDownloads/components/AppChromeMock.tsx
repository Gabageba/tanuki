import { use, type ReactNode } from 'react';
import { ActionIcon, Box, Group, Paper, Skeleton, Stack, Text, Title } from '@mantine/core';
import {
  BellIcon,
  BookmarkSimpleIcon,
  HouseIcon,
  ListIcon,
  PawPrintIcon,
  SquaresFourIcon,
} from '@phosphor-icons/react';
import { HEADER_HEIGHT } from '@/shared/lib/appShell';
import { PHONE_FRAME_CONTEXT } from '../../Notifications/models';
import { ACCENT_TAB_BACKGROUND, getHeaderBorder } from '../lib';
import { OFFLINE_SIGNAL, type OfflineSignal } from '../models';
import OfflineAvatar from './OfflineAvatar';
import OfflineCapsule from './OfflineCapsule';
import OfflineDownloadsButton from './OfflineDownloadsButton';
import OfflineHeaderBadge from './OfflineHeaderBadge';
import OfflineIcon from './OfflineIcon';
import OfflineSearchField from './OfflineSearchField';
import OfflineSnackbar from './OfflineSnackbar';
import OfflineStrip from './OfflineStrip';
import OfflineTab from './OfflineTab';
import styles from '../OfflineDownloads.module.scss';

type Props = {
  signal: OfflineSignal;
  /** Страница под шапкой; без неё — закладки из кеша. */
  children?: ReactNode;
};

/** Каркас приложения без сети: шапка, страница закладок из кеша и на телефоне нижняя панель — с
 *  индикацией по варианту оси N. */
function AppChromeMock({ signal, children }: Props) {
  const isPhone = use(PHONE_FRAME_CONTEXT);
  const isMuted = signal === OFFLINE_SIGNAL.MUTED_HEADER;

  return (
    <Stack gap={0}>
      <Box
        h={HEADER_HEIGHT}
        px="md"
        style={{ borderBottom: getHeaderBorder(signal) }}
        bg={signal === OFFLINE_SIGNAL.TAB_ACCENT_HEADER ? ACCENT_TAB_BACKGROUND : undefined}
        className={isMuted ? styles.mutedHeader : undefined}
      >
        <Group h="100%" justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <PawPrintIcon size={24} weight="fill" color="var(--mantine-primary-color-filled)" />
            <Text lh={1} ff="var(--tanuki-font-brand)" fw={600} fz={16}>
              Tanuki
            </Text>
            {signal === OFFLINE_SIGNAL.HEADER_BADGE && <OfflineHeaderBadge />}
          </Group>
          {signal === OFFLINE_SIGNAL.SEARCH && !isPhone && <OfflineSearchField />}
          <Group gap={4} wrap="nowrap">
            {signal === OFFLINE_SIGNAL.SEARCH && isPhone && <OfflineSearchField />}
            {signal === OFFLINE_SIGNAL.DOWNLOADS_BUTTON && !isPhone && <OfflineDownloadsButton />}
            {signal === OFFLINE_SIGNAL.ICON && <OfflineIcon />}
            {!isPhone && (
              <>
                <ActionIcon variant="subtle" color="gray" size={34}>
                  <BookmarkSimpleIcon size={20} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="gray" size={34}>
                  <BellIcon size={20} />
                </ActionIcon>
              </>
            )}
            <OfflineAvatar isOffline={signal === OFFLINE_SIGNAL.AVATAR_STATUS} />
          </Group>
        </Group>
      </Box>
      {(signal === OFFLINE_SIGNAL.STRIP ||
        signal === OFFLINE_SIGNAL.STRIP_STRONG ||
        signal === OFFLINE_SIGNAL.STRIP_NEUTRAL ||
        signal === OFFLINE_SIGNAL.STRIP_HEADER ||
        signal === OFFLINE_SIGNAL.STRIP_BUTTON ||
        signal === OFFLINE_SIGNAL.STRIP_LINK_GOLD ||
        signal === OFFLINE_SIGNAL.STRIP_LINK_ACCENT ||
        signal === OFFLINE_SIGNAL.STRIP_LINK_TEXT) && <OfflineStrip signal={signal} />}
      {(signal === OFFLINE_SIGNAL.TAB_GOLD ||
        signal === OFFLINE_SIGNAL.TAB_INVERTED ||
        signal === OFFLINE_SIGNAL.TAB_ACCENT ||
        signal === OFFLINE_SIGNAL.TAB_CENTER ||
        signal === OFFLINE_SIGNAL.TAB_ACCENT_NO_LINE ||
        signal === OFFLINE_SIGNAL.TAB_ACCENT_FILL ||
        signal === OFFLINE_SIGNAL.TAB_ACCENT_LINE ||
        signal === OFFLINE_SIGNAL.TAB_ACCENT_HEADER) && <OfflineTab signal={signal} />}
      <Box pos="relative">
        {signal === OFFLINE_SIGNAL.CAPSULE && <OfflineCapsule />}
        {signal === OFFLINE_SIGNAL.SNACKBAR && <OfflineSnackbar />}
        {children ? (
          <Box p="md">{children}</Box>
        ) : (
          <Stack gap="sm" p="md" mih={isPhone ? 260 : 200}>
            <Title order={3}>Закладки</Title>
            <Group gap="sm" wrap="nowrap">
              {Array.from({ length: isPhone ? 3 : 6 }, (_, index) => (
                <Skeleton
                  key={index}
                  h={isPhone ? 140 : 160}
                  flex={1}
                  radius="md"
                  animate={false}
                />
              ))}
            </Group>
          </Stack>
        )}
      </Box>
      {isPhone && (
        <Paper withBorder radius={0} px="xs" h={HEADER_HEIGHT}>
          <Group h="100%" justify="space-around" wrap="nowrap">
            <HouseIcon size={20} />
            <SquaresFourIcon size={20} />
            {signal === OFFLINE_SIGNAL.DOWNLOADS_BUTTON && <OfflineDownloadsButton isCompact />}
            <BookmarkSimpleIcon
              size={20}
              weight="fill"
              color="var(--mantine-primary-color-filled)"
            />
            <BellIcon size={20} />
            <ListIcon size={20} />
          </Group>
        </Paper>
      )}
    </Stack>
  );
}

export default AppChromeMock;
