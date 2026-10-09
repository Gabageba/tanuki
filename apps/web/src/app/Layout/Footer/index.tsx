import { AppShell, Group, Indicator } from '@mantine/core';
import { BellIcon, BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import UnreadNotificationsIndicator from '@/entities/notification/UnreadNotificationsIndicator';
import { closeAllDrawers } from '@/shared/lib/drawerRegistry';
import MobileNavigationButton from './components/MobileNavigationButton';
import MobileSourceSelect from './components/MobileSourceSelect';
import useIsActiveUrl from './hooks/useIsActiveUrl';
import MobileMenuButton from './components/MobileMenuButton';
import styles from './Footer.module.scss';

function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: bookmarkFolders } = useBookmarkFolders();
  const isSourcesActive = useIsActiveUrl([
    ROUTE_PATHS.SOURCES,
    ROUTE_PATHS.CATALOG,
    ROUTE_PATHS.TITLE,
  ]);
  const isBookmarksActive = useIsActiveUrl(ROUTE_PATHS.BOOKMARKS);
  const isNotificationsActive = useIsActiveUrl(ROUTE_PATHS.NOTIFICATIONS);
  const isMenuActive = useIsActiveUrl([
    ROUTE_PATHS.PROFILE,
    ROUTE_PATHS.SETTINGS,
    ROUTE_PATHS.SOURCES_HEALTH,
    ROUTE_PATHS.MANAGEMENT,
    `${ROUTE_PATHS.PLAYGROUND}/*`,
  ]);

  const [isSourcesOpened, setIsSourcesOpened] = useState(false);
  const [isMenuOpened, setIsMenuOpened] = useState(false);

  // Drawer закрывается не кликом по пункту, а самой сменой страницы: переход react-router идёт
  // транзишеном и коммитится позже клика, и закрытие по клику на кадр гасило бы кнопку раньше,
  // чем загорится новая. Смотрим на pathname, а не на key: страницы сами дописывают параметры
  // в адрес (replace), и drawer, открытый во время загрузки, не должен от этого закрываться.
  const { pathname } = useLocation();
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsSourcesOpened(false);
    setIsMenuOpened(false);
  }

  // Переход на текущую страницу pathname не меняет — тогда drawer'ы закрываем сами.
  const navigateFromFooter = (path: string, isCurrent: boolean) => {
    if (isCurrent) {
      setIsSourcesOpened(false);
      setIsMenuOpened(false);
    }
    navigate(path);
  };

  return (
    <AppShell.Footer hiddenFrom="md" withBorder className={styles.footer}>
      <Group h="100%" px="xs" gap={4} onClick={closeAllDrawers}>
        <MobileSourceSelect
          isActive={(isSourcesActive || isSourcesOpened) && !isMenuOpened}
          isOpened={isSourcesOpened}
          setIsOpened={(opened) => {
            setIsSourcesOpened(opened);
            setIsMenuOpened(false);
          }}
        />
        <MobileNavigationButton
          onClick={() => navigateFromFooter(ROUTE_PATHS.BOOKMARKS, isBookmarksActive)}
          title={t('bookmarks')}
          isActive={isBookmarksActive && !isSourcesOpened && !isMenuOpened}
          leftSection={
            <Indicator size={8} offset={{ x: 5, y: 3 }} disabled={!bookmarkFolders?.hasNew}>
              <BookmarkSimpleIcon size={20} />
            </Indicator>
          }
        />
        <MobileNavigationButton
          onClick={() => navigateFromFooter(ROUTE_PATHS.NOTIFICATIONS, isNotificationsActive)}
          title={t('notifications')}
          isActive={isNotificationsActive && !isSourcesOpened && !isMenuOpened}
          leftSection={
            <UnreadNotificationsIndicator>
              <BellIcon size={20} />
            </UnreadNotificationsIndicator>
          }
        />
        <MobileMenuButton
          isOpened={isMenuOpened}
          isActive={isMenuOpened || (isMenuActive && !isSourcesOpened)}
          setIsOpened={(opened) => {
            setIsMenuOpened(opened);
            setIsSourcesOpened(false);
          }}
        />
      </Group>
    </AppShell.Footer>
  );
}

export default Footer;
