import { AppShell, Group } from '@mantine/core';
import { BellIcon, BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { ROUTE_PATHS } from '@/shared/consts/routes';
import { closeAllDrawers } from '@/shared/lib/drawerRegistry';
import MobileNavigationButton from './components/MobileNavigationButton';
import MobileSourceSelect from './components/MobileSourceSelect';
import useIsActiveUrl from './hooks/useIsActiveUrl';
import MobileMenuButton from './components/MobileMenuButton';
import styles from './Footer.module.scss';

function Footer() {
  const navigate = useNavigate();
  const isSourcesActive = useIsActiveUrl([
    ROUTE_PATHS.SOURCES,
    ROUTE_PATHS.CATALOG,
    ROUTE_PATHS.MANGA,
  ]);
  const isBookmarksActive = useIsActiveUrl(ROUTE_PATHS.BOOKMARKS);
  const isNotificationsActive = useIsActiveUrl(ROUTE_PATHS.NOTIFICATIONS);

  const [isSourcesOpened, setIsSourcesOpened] = useState(false);
  const [isMenuOpened, setIsMenuOpened] = useState(false);

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
          onClick={() => {
            navigate(ROUTE_PATHS.BOOKMARKS);
            setIsSourcesOpened(false);
            setIsMenuOpened(false);
          }}
          title="Закладки"
          isActive={isBookmarksActive && !isSourcesOpened && !isMenuOpened}
          leftSection={<BookmarkSimpleIcon size={20} />}
        />
        <MobileNavigationButton
          onClick={() => {
            navigate(ROUTE_PATHS.NOTIFICATIONS);
            setIsSourcesOpened(false);
            setIsMenuOpened(false);
          }}
          title="Уведомления"
          isActive={isNotificationsActive && !isSourcesOpened && !isMenuOpened}
          leftSection={<BellIcon size={20} />}
        />
        <MobileMenuButton
          isOpened={isMenuOpened}
          isActive={isMenuOpened}
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
