import { Button, Group, Pill, Stack, Text } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';
import { MOCK_RECENT } from '../mocks';
import EmptyPageTitle from './EmptyPageTitle';
import SearchInvite from './SearchInvite';

type Props = {
  hasHistory: boolean;
};

/** E4 — ряд недавних сверху, под ним приглашение остаётся всегда. */
function RecentChipsAndInvite({ hasHistory }: Props) {
  return (
    <Stack gap="md">
      <EmptyPageTitle />
      {hasHistory && (
        <Stack gap={6}>
          <Group justify="space-between" wrap="nowrap">
            <Text fz="xs" c="dimmed">
              Недавние запросы
            </Text>
            <Button variant="subtle" color="gray" size="compact-xs" leftSection={<TrashIcon />}>
              Очистить
            </Button>
          </Group>
          <Group gap="xs">
            {MOCK_RECENT.map((query) => (
              <Pill key={query} variant="muted" size="md" withRemoveButton maw={240}>
                {query}
              </Pill>
            ))}
          </Group>
        </Stack>
      )}
      <SearchInvite />
    </Stack>
  );
}

export default RecentChipsAndInvite;
