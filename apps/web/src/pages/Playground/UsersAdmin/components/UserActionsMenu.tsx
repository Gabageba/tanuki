import { ActionIcon, Menu } from '@mantine/core';
import {
  DotsThreeVerticalIcon,
  LockOpenIcon,
  ProhibitIcon,
  ShieldCheckIcon,
  ShieldSlashIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { USER_ROLE } from '@tanuki/contracts';
import { USER_STATUS, type MockUser, type Permissions } from '../models';

type Props = {
  user: MockUser;
  permissions: Permissions;
  /** Роль меняется в самой ячейке (A2) — в меню её нет. */
  withRole: boolean;
  onRoleToggle: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onDelete: () => void;
};

/** «…» в строке. Чего нельзя — того в меню нет; нет ни одного пункта — нет и кнопки. */
function UserActionsMenu({
  user,
  permissions,
  withRole,
  onRoleToggle,
  onBlock,
  onUnblock,
  onDelete,
}: Props) {
  const showRole = withRole && permissions.canChangeRole;

  if (!showRole && !permissions.canBlock && !permissions.canDelete) {
    return null;
  }

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" onClick={(event) => event.stopPropagation()}>
          <DotsThreeVerticalIcon />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown onClick={(event) => event.stopPropagation()}>
        {showRole &&
          (user.role === USER_ROLE.MODERATOR ? (
            <Menu.Item leftSection={<ShieldSlashIcon />} onClick={onRoleToggle}>
              Снять модератора
            </Menu.Item>
          ) : (
            <Menu.Item leftSection={<ShieldCheckIcon />} onClick={onRoleToggle}>
              Сделать модератором
            </Menu.Item>
          ))}
        {permissions.canBlock &&
          (user.status === USER_STATUS.BLOCKED ? (
            <Menu.Item leftSection={<LockOpenIcon />} onClick={onUnblock}>
              Разблокировать
            </Menu.Item>
          ) : (
            <Menu.Item leftSection={<ProhibitIcon />} onClick={onBlock}>
              Заблокировать
            </Menu.Item>
          ))}
        {permissions.canDelete && (
          <>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<TrashIcon />} onClick={onDelete}>
              Удалить
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

export default UserActionsMenu;
