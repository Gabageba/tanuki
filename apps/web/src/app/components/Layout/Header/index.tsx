import { ActionIcon, Anchor, AppShell, Group, TextInput } from '@mantine/core';
import type { SubmitEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CaretRightIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import ColorSchemeToggle from '../ColorSchemeToggle';
import LogoHorizontal from '../../icons/LogoHorizontal';
import styles from './Header.module.scss';

function Header() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim()) {
      void navigate(`/search?query=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Anchor component={Link} to="/" c="inherit" underline="never">
          <LogoHorizontal />
        </Anchor>
        <form onSubmit={handleSearch} className={styles.form}>
          <TextInput
            leftSection={<MagnifyingGlassIcon />}
            rightSection={
              <ActionIcon variant="transparent" size="sm" radius="sm" color="dimmed">
                <CaretRightIcon />
              </ActionIcon>
            }
            placeholder="Искать по всем источникам…"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </form>
        <Group flex={1} justify="end">
          <ColorSchemeToggle />
        </Group>
      </Group>
    </AppShell.Header>
  );
}

export default Header;
