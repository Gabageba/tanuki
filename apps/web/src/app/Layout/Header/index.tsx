import { Anchor, AppShell, Group, Typography } from '@mantine/core';
import { Link, useNavigate } from 'react-router';
import { BellIcon, BookmarkSimpleIcon } from '@phosphor-icons/react';
import LogoHorizontal from './LogoHorizontal';
import DesktopNavigateButton from './components/DesktopNavigateButton';
import Avatar from './components/Avatar';
import DesktopSourceSelect from './components/DesktopSourceSelect';
import SearchInput from '@/shared/ui/SearcInput';
import styles from './Header.module.scss';

function Header() {
  const navigate = useNavigate();

  const handleSearch = (query: string) =>
    navigate(`/search?query=${encodeURIComponent(query.trim())}`);

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Group gap="sm">
          <Anchor component={Link} to="/sources" c="inherit" underline="never">
            <LogoHorizontal />
          </Anchor>
          <Typography className={styles.divider} visibleFrom="md" />
          <DesktopSourceSelect />
        </Group>

        <Group justify="end" flex={1} gap="sm">
          <SearchInput
            handleSearch={handleSearch}
            className={styles.form}
            placeholder="Искать по всем источникам"
          />
          <Group gap={4} visibleFrom="md">
            <DesktopNavigateButton icon={<BookmarkSimpleIcon size={20} />} />
            <DesktopNavigateButton icon={<BellIcon size={20} />} />
          </Group>
          <Avatar />
        </Group>
      </Group>
    </AppShell.Header>
  );
}

export default Header;
