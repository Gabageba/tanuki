import { ActionIcon, Box, Divider, Group, Stack, TextInput } from '@mantine/core';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { MOCK_RECENT } from '../mocks';
import { REMOVE_VISIBILITY } from '../models';
import RecentDropdownHeader from './RecentDropdownHeader';
import RecentRow from './RecentRow';

/** D4 на телефоне — поиск занимает весь экран под шапкой: строка во всю ширину со стрелкой
 *  назад, недавние — списком без рамки дропдауна. */
function RecentFullscreen() {
  return (
    <Stack gap={0} mih={480}>
      <Group gap="xs" wrap="nowrap" pb="sm">
        <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Назад">
          <ArrowLeftIcon size={20} />
        </ActionIcon>
        <TextInput
          flex={1}
          leftSection={<MagnifyingGlassIcon />}
          placeholder="Искать во всех источниках"
          styles={{ input: { borderColor: 'var(--mantine-primary-color-filled)' } }}
        />
      </Group>
      <Divider mx="-sm" />
      <Box pt={4}>
        <RecentDropdownHeader />
        {MOCK_RECENT.map((query) => (
          <RecentRow
            key={query}
            query={query}
            isLarge
            removeVisibility={REMOVE_VISIBILITY.ALWAYS}
          />
        ))}
      </Box>
    </Stack>
  );
}

export default RecentFullscreen;
