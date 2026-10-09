import { Button, Group, Stack, Title } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';
import { MOCK_RECENT } from '../mocks';
import { REMOVE_VISIBILITY } from '../models';
import EmptyPageTitle from './EmptyPageTitle';
import RecentRow from './RecentRow';
import SearchInvite from './SearchInvite';

type Props = {
  hasHistory: boolean;
};

/** E1 — недавние списком прямо на странице, строки крупнее, чем в дропдауне. */
function RecentPageList({ hasHistory }: Props) {
  return (
    <Stack gap="md">
      <EmptyPageTitle />
      {hasHistory ? (
        <Stack gap={4} maw={640}>
          <Group justify="space-between" wrap="nowrap">
            <Title order={4}>Недавние запросы</Title>
            <Button variant="subtle" color="gray" size="compact-sm" leftSection={<TrashIcon />}>
              Очистить
            </Button>
          </Group>
          {MOCK_RECENT.map((query) => (
            <RecentRow
              key={query}
              query={query}
              isLarge
              removeVisibility={REMOVE_VISIBILITY.ALWAYS}
            />
          ))}
        </Stack>
      ) : (
        <SearchInvite />
      )}
    </Stack>
  );
}

export default RecentPageList;
