import { Avatar } from '@mantine/core';
import { isStaffRole, type CurrentUser } from '@tanuki/contracts';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import EntityHeading from '@/shared/ui/EntityHeading';
import RoleBadge from '@/entities/user/components/RoleBadge';

type Props = {
  user: CurrentUser;
};

/** Карточка аккаунта наверху меню: аватар, имя, роль у персонала, почта. Ничего не делает —
 *  в профиль ведёт пункт «Профиль». */
function AccountHeading({ user }: Props) {
  return (
    <EntityHeading
      icon={
        <Avatar
          color={PRIMARY_COLOR}
          variant="outline"
          src={user.avatarUrl}
          name={user.username}
          size={40}
        />
      }
      title={user.username}
      badge={isStaffRole(user.role) && <RoleBadge role={user.role} size="xs" />}
      subtitle={user.email}
    />
  );
}

export default AccountHeading;
