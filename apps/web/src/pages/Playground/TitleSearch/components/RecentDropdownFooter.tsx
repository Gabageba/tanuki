import { Button, Divider } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';
import { MOCK_RECENT } from '../mocks';
import { REMOVE_VISIBILITY } from '../models';
import RecentDropdownHeader from './RecentDropdownHeader';
import RecentRow from './RecentRow';

/** D2 — крестик у каждого пункта всегда, «Очистить» — в подвале. */
function RecentDropdownFooter() {
  return (
    <>
      <RecentDropdownHeader withClear={false} />
      {MOCK_RECENT.map((query) => (
        <RecentRow key={query} query={query} removeVisibility={REMOVE_VISIBILITY.ALWAYS} />
      ))}
      <Divider my={4} />
      <Button variant="subtle" color="gray" size="xs" fullWidth leftSection={<TrashIcon />}>
        Очистить
      </Button>
    </>
  );
}

export default RecentDropdownFooter;
