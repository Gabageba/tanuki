import { EmptyState, Group, Pill, Stack } from '@mantine/core';
import { MOCK_RECENT } from '../mocks';
import EmptyPageTitle from './EmptyPageTitle';
import SearchInvite from './SearchInvite';

type Props = {
  hasHistory: boolean;
};

/** E2 — всегда приглашение; недавние — пилюлями внутри него. */
function RecentEmptyState({ hasHistory }: Props) {
  return (
    <Stack gap="md">
      <EmptyPageTitle />
      <SearchInvite>
        {hasHistory && (
          <EmptyState.Actions>
            <Group gap="xs" justify="center" maw={560}>
              {MOCK_RECENT.map((query) => (
                <Pill key={query} variant="muted" size="lg" withRemoveButton maw={240}>
                  {query}
                </Pill>
              ))}
            </Group>
          </EmptyState.Actions>
        )}
      </SearchInvite>
    </Stack>
  );
}

export default RecentEmptyState;
