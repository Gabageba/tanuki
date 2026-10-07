import { ActionIcon, Button, Group, Select, TextInput, Tooltip } from '@mantine/core';
import {
  FolderSimplePlusIcon,
  GearSixIcon,
  MagnifyingGlassIcon,
  SortDescendingIcon,
} from '@phosphor-icons/react';
import { getSortLabel } from '../lib';
import { SORT } from '../models';

type Props = {
  /** A2 — «Новая папка» и настройки справа в этой строке. */
  withActions?: boolean;
  /** Рамка телефона: всё в одну строку, действия — только иконками. */
  compact?: boolean;
};

const SORT_OPTIONS = Object.values(SORT).map((value) => ({ value, label: getSortLabel(value) }));

/** Поиск по названию и сортировка под вкладками. */
function BookmarksToolbar({ withActions = false, compact = false }: Props) {
  return (
    <Group gap="xs" wrap="nowrap">
      <TextInput
        flex={1}
        miw={0}
        maw={compact ? undefined : 320}
        placeholder="Поиск по названию"
        leftSection={<MagnifyingGlassIcon />}
      />
      <Select
        w={compact ? 136 : 200}
        flex="none"
        data={SORT_OPTIONS}
        defaultValue={SORT.UPDATED}
        aria-label="Сортировка"
        leftSection={<SortDescendingIcon />}
        comboboxProps={{ width: 220, position: 'bottom-end' }}
        allowDeselect={false}
      />
      {withActions && (
        <Group gap={4} wrap="nowrap" ml={compact ? 0 : 'auto'} flex="none">
          {compact ? (
            <Tooltip label="Новая папка">
              <ActionIcon variant="default" size={36} aria-label="Новая папка">
                <FolderSimplePlusIcon />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Button variant="default" leftSection={<FolderSimplePlusIcon />}>
              Новая папка
            </Button>
          )}
          <Tooltip label="Управлять папками">
            <ActionIcon variant="default" size={36} aria-label="Управлять папками">
              <GearSixIcon />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
    </Group>
  );
}

export default BookmarksToolbar;
