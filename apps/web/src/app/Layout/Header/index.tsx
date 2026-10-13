import { Anchor, AppShell, Box, Group, Indicator, Typography } from '@mantine/core';
import { Link } from 'react-router';
import { BellIcon, BookmarkSimpleIcon, HouseIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import LogoHorizontal from './LogoHorizontal';
import Avatar from './components/Avatar';
import DesktopSourceSelect from './components/DesktopSourceSelect';
import HeaderIconButton from './components/HeaderIconButton';
import HeaderSearch from './components/HeaderSearch';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import UnreadNotificationsIndicator from '@/entities/notification/UnreadNotificationsIndicator';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useIsActiveUrl from '../hooks/useIsActiveUrl';
import styles from './Header.module.scss';

function Header() {
  const { t } = useTranslation();
  const { data: bookmarkFolders } = useBookmarkFolders();
  // Подборки — продолжение главной: «Назад» с них ведёт туда, домик остаётся выделенным.
  const isHomeActive = useIsActiveUrl([ROUTE_PATHS.HOME, ROUTE_PATHS.SELECTIONS]);
  const isBookmarksActive = useIsActiveUrl(ROUTE_PATHS.BOOKMARKS);
  const isNotificationsActive = useIsActiveUrl(ROUTE_PATHS.NOTIFICATIONS);

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Group gap="sm">
          <Anchor component={Link} to={ROUTE_PATHS.HOME} c="inherit" underline="never">
            <LogoHorizontal textVisibleFrom="sm" />
          </Anchor>
          <Typography className={styles.divider} visibleFrom="md" />
          <Box visibleFrom="md">
            <HeaderIconButton to={ROUTE_PATHS.HOME} label={t('home')} isActive={isHomeActive}>
              <HouseIcon size={20} weight={isHomeActive ? 'fill' : 'regular'} />
            </HeaderIconButton>
          </Box>
          <DesktopSourceSelect />
        </Group>

        <Group justify="end" flex={1} gap="sm">
          <HeaderSearch className={styles.form} />
          <Group gap={4} visibleFrom="md">
            <HeaderIconButton
              to={ROUTE_PATHS.BOOKMARKS}
              label={t('bookmarks')}
              isActive={isBookmarksActive}
            >
              <Indicator size={8} offset={{ x: 5, y: 3 }} disabled={!bookmarkFolders?.hasNew}>
                <BookmarkSimpleIcon size={20} weight={isBookmarksActive ? 'fill' : 'regular'} />
              </Indicator>
            </HeaderIconButton>
            <HeaderIconButton
              to={ROUTE_PATHS.NOTIFICATIONS}
              label={t('notifications')}
              isActive={isNotificationsActive}
            >
              <UnreadNotificationsIndicator>
                <BellIcon size={20} weight={isNotificationsActive ? 'fill' : 'regular'} />
              </UnreadNotificationsIndicator>
            </HeaderIconButton>
          </Group>
          <Avatar />
        </Group>
      </Group>
    </AppShell.Header>
  );
}

export default Header;
