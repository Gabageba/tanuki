import { Button, CloseButton, Stack } from '@mantine/core';
import { ClockCounterClockwiseIcon, TrashIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { MOCK_RECENT } from '../mocks';
import EmptyPageTitle from './EmptyPageTitle';
import SearchInvite from './SearchInvite';

type Props = {
  hasHistory: boolean;
};

/** E3 — недавние в `GroupedList`, как группы настроек; «Очистить» — в подвале. */
function RecentGroupedList({ hasHistory }: Props) {
  return (
    <Stack gap="md">
      <EmptyPageTitle />
      {hasHistory ? (
        <Stack maw={640}>
          <GroupedList label="Недавние запросы">
            {MOCK_RECENT.map((query) => (
              <GroupedList.Row
                key={query}
                icon={<ClockCounterClockwiseIcon />}
                title={query}
                action={<CloseButton size="sm" aria-label="Удалить из недавних" />}
                isActionCompact
              />
            ))}
            <GroupedList.Footer>
              <Button variant="subtle" color="gray" size="xs" leftSection={<TrashIcon />}>
                Очистить
              </Button>
            </GroupedList.Footer>
          </GroupedList>
        </Stack>
      ) : (
        <SearchInvite />
      )}
    </Stack>
  );
}

export default RecentGroupedList;
