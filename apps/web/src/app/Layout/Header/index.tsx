import { ActionIcon, Anchor, AppShell, Group, Indicator, Tooltip, Typography } from '@mantine/core';
import { Link, useNavigate } from 'react-router';
import { BellIcon, BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import LogoHorizontal from './LogoHorizontal';
import DesktopNavigateButton from './components/DesktopNavigateButton';
import Avatar from './components/Avatar';
import DesktopSourceSelect from './components/DesktopSourceSelect';
import SearchInput from '@/shared/ui/SearcInput';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import styles from './Header.module.scss';

function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: bookmarkFolders } = useBookmarkFolders();

  const handleSearch = (query: string) =>
    navigate(`/search?query=${encodeURIComponent(query.trim())}`);

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Group gap="sm">
          <Anchor component={Link} to="/sources" c="inherit" underline="never">
            <LogoHorizontal textVisibleFrom="sm" />
          </Anchor>
          <Typography className={styles.divider} visibleFrom="md" />
          <DesktopSourceSelect />
        </Group>

        <Group justify="end" flex={1} gap="sm">
          <SearchInput
            handleSearch={handleSearch}
            className={styles.form}
            placeholder={t('searchAllSources')}
          />
          <Group gap={4} visibleFrom="md">
            <Tooltip label={t('bookmarks')}>
              <ActionIcon
                component={Link}
                to={ROUTE_PATHS.BOOKMARKS}
                size="lg"
                variant="subtle"
                color="gray"
                aria-label={t('bookmarks')}
              >
                <Indicator size={8} offset={{ x: 5, y: 3 }} disabled={!bookmarkFolders?.hasNew}>
                  <BookmarkSimpleIcon size={20} />
                </Indicator>
              </ActionIcon>
            </Tooltip>
            <DesktopNavigateButton icon={<BellIcon size={20} />} />
          </Group>
          <Avatar />
        </Group>
      </Group>
    </AppShell.Header>
  );
}

export default Header;
