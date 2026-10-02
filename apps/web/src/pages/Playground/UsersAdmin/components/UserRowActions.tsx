import { USER_ROLE } from '@tanuki/contracts';
import {
  ACTIONS_MODE,
  type ActionsMode,
  type MockUser,
  type Permissions,
  type RowHandlers,
} from '../models';
import UserActionsMenu from './UserActionsMenu';

type Props = {
  user: MockUser;
  permissions: Permissions;
  mode: ActionsMode;
  handlers: RowHandlers;
};

/** Меню «…» строки. В A2 роль уже в своей ячейке, в A3 действия живут в drawer. */
function UserRowActions({ user, permissions, mode, handlers }: Props) {
  if (mode === ACTIONS_MODE.DRAWER) {
    return null;
  }

  return (
    <UserActionsMenu
      user={user}
      permissions={permissions}
      withRole={mode === ACTIONS_MODE.MENU}
      onRoleToggle={() =>
        handlers.onRoleChange(
          user,
          user.role === USER_ROLE.MODERATOR ? USER_ROLE.USER : USER_ROLE.MODERATOR,
        )
      }
      onBlock={() => handlers.onBlock(user)}
      onUnblock={() => handlers.onUnblock(user)}
      onDelete={() => handlers.onDelete(user)}
    />
  );
}

export default UserRowActions;
