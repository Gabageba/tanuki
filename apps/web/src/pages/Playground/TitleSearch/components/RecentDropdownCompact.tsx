import { useContext } from 'react';
import { ActionIcon, Group, Text, Tooltip } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { MOCK_RECENT } from '../mocks';
import { REMOVE_VISIBILITY } from '../models';
import RecentRow from './RecentRow';

/** D3 — без иконок у пунктов, плотные строки; «Очистить» — корзиной в заголовке. */
function RecentDropdownCompact() {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);

  return (
    <>
      <Group justify="space-between" px="sm" pt={4} wrap="nowrap">
        <Text fz="xs" c="dimmed">
          Недавние запросы
        </Text>
        <Tooltip label="Очистить">
          <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Очистить">
            <TrashIcon />
          </ActionIcon>
        </Tooltip>
      </Group>
      {MOCK_RECENT.map((query) => (
        <RecentRow
          key={query}
          query={query}
          withIcon={false}
          isCompact
          removeVisibility={isPhone ? REMOVE_VISIBILITY.ALWAYS : REMOVE_VISIBILITY.HOVER}
        />
      ))}
    </>
  );
}

export default RecentDropdownCompact;
