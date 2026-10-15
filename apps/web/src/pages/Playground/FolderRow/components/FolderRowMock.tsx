import type { MouseEvent } from 'react';
import { ActionIcon, Box, Group, Menu, Switch, Text } from '@mantine/core';
import {
  DotsSixVerticalIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import FolderGlyph from '../../Bookmarks/components/FolderGlyph';
import { resolveFolder } from '../../Bookmarks/lib';
import { BUILT_IN_STYLE, type MockFolder } from '../../Bookmarks/models';
import { MENU_WIDTH, ROW_VARIANT, type RowVariant } from '../models';
import bookmarksStyles from '../../Bookmarks/Bookmarks.module.scss';
import styles from '../FolderRow.module.scss';

type Props = {
  folder: MockFolder;
  variant: RowVariant;
  /** В списке есть своя папка — V0a держит место под меню у встроенных только тогда. */
  hasCustom: boolean;
  isTracked: boolean;
  onTrackedChange: (isTracked: boolean) => void;
  /** Меню «Переименовать» (V0, V1, V4). */
  onRename: () => void;
  /** Меню «Удалить» (V0, V1, V4). */
  onDelete: () => void;
  /** Модалка «Изменить папку» с удалением внутри (V2, V3). */
  onEdit: () => void;
};

/** Клик по ручке и тумблеру не должен открывать папку в V2. */
const stopPropagation = (event: MouseEvent) => event.stopPropagation();

/** Строка папки в настройках в одном из вариантов V0–V4 и V0a. */
function FolderRowMock({
  folder,
  variant,
  hasCustom,
  isTracked,
  onTrackedChange,
  onRename,
  onDelete,
  onEdit,
}: Props) {
  const resolved = resolveFolder(folder, BUILT_IN_STYLE.SEMANTIC);
  const isEditable = !resolved.isBuiltIn;
  const isRowClickable = variant === ROW_VARIANT.ROW_CLICK && isEditable;

  const handle = (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="sm"
      className={bookmarksStyles.dragHandle}
      aria-label="Изменить порядок"
      onClick={stopPropagation}
    >
      <DotsSixVerticalIcon />
    </ActionIcon>
  );
  const trackSwitch = (
    <Box lh={0} onClick={stopPropagation}>
      <Switch
        checked={isTracked}
        onChange={(event) => onTrackedChange(event.currentTarget.checked)}
        aria-label="Следить за обновлениями"
        classNames={{ track: bookmarksStyles.switchTrack }}
      />
    </Box>
  );
  const menu = isEditable && (
    <Menu position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" aria-label="Действия с папкой">
          <DotsThreeIcon />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<PencilSimpleIcon />} onClick={onRename}>
          Переименовать
        </Menu.Item>
        <Menu.Item color="red" leftSection={<TrashIcon />} onClick={onDelete}>
          Удалить
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
  const name = (
    <Text fz={14} lh="tight" truncate title={resolved.name}>
      {resolved.name}
    </Text>
  );

  const getIcon = () => {
    switch (variant) {
      case ROW_VARIANT.SWITCH_LEFT:
        return (
          <Group gap="xs" wrap="nowrap">
            {handle}
            {trackSwitch}
            <FolderGlyph folder={resolved} size={22} />
          </Group>
        );
      case ROW_VARIANT.CURRENT:
      case ROW_VARIANT.CURRENT_COMPACT:
      case ROW_VARIANT.ROW_CLICK:
      case ROW_VARIANT.PENCIL:
      case ROW_VARIANT.ORDER:
        return (
          <Group gap="xs" wrap="nowrap">
            {handle}
            <FolderGlyph folder={resolved} size={22} />
          </Group>
        );
      case ROW_VARIANT.TRACKING:
        return <FolderGlyph folder={resolved} size={22} />;
    }
  };

  const getTitle = () => {
    switch (variant) {
      case ROW_VARIANT.PENCIL:
        return (
          <Group gap={4} wrap="nowrap" miw={0}>
            {name}
            {isEditable && (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label="Изменить папку"
                onClick={onEdit}
              >
                <PencilSimpleIcon />
              </ActionIcon>
            )}
          </Group>
        );
      case ROW_VARIANT.CURRENT:
      case ROW_VARIANT.CURRENT_COMPACT:
      case ROW_VARIANT.SWITCH_LEFT:
      case ROW_VARIANT.ROW_CLICK:
      case ROW_VARIANT.ORDER:
      case ROW_VARIANT.TRACKING:
        return name;
    }
  };

  const getAction = () => {
    switch (variant) {
      case ROW_VARIANT.CURRENT:
        return (
          <Group gap="xs" wrap="nowrap">
            {trackSwitch}
            {menu || <Box w={MENU_WIDTH} />}
          </Group>
        );
      case ROW_VARIANT.CURRENT_COMPACT:
        return (
          <Group gap="xs" wrap="nowrap">
            {trackSwitch}
            {menu || (hasCustom && <Box w={MENU_WIDTH} />)}
          </Group>
        );
      case ROW_VARIANT.SWITCH_LEFT:
      case ROW_VARIANT.ORDER:
        return menu;
      case ROW_VARIANT.ROW_CLICK:
      case ROW_VARIANT.PENCIL:
      case ROW_VARIANT.TRACKING:
        return trackSwitch;
    }
  };

  return (
    <Box
      className={`${bookmarksStyles.sortableRow} ${styles.row}`}
      mod={{ clickable: isRowClickable }}
      onClick={isRowClickable ? onEdit : undefined}
    >
      <GroupedList.Row
        icon={getIcon()}
        title={getTitle()}
        isActionCompact
        action={getAction() || undefined}
      />
    </Box>
  );
}

export default FolderRowMock;
