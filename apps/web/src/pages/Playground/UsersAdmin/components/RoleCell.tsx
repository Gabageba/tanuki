import {
  ACTIONS_MODE,
  type ActionsMode,
  type MockUser,
  type Permissions,
  type RowHandlers,
} from '../models';
import RoleBadge from './RoleBadge';
import RoleSelect from './RoleSelect';

type Props = {
  user: MockUser;
  permissions: Permissions;
  mode: ActionsMode;
  handlers: RowHandlers;
};

/** В A2 у того, кому можно менять роль, — Select; у остальных и в других вариантах — бейдж. */
function RoleCell({ user, permissions, mode, handlers }: Props) {
  if (mode === ACTIONS_MODE.ROLE_SELECT && permissions.canChangeRole) {
    return <RoleSelect role={user.role} onChange={(role) => handlers.onRoleChange(user, role)} />;
  }

  return <RoleBadge role={user.role} />;
}

export default RoleCell;
