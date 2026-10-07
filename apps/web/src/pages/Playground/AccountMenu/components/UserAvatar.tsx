import { Avatar } from '@mantine/core';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import type { MockUser } from '../models';

type Props = {
  user: MockUser;
  size: number;
};

/** Аватар как в шапке: акцентный цвет и outline; без фото — инициалы из логина. */
function UserAvatar({ user, size }: Props) {
  return (
    <Avatar
      color={PRIMARY_COLOR}
      variant="outline"
      src={user.avatarUrl}
      name={user.username}
      size={size}
    />
  );
}

export default UserAvatar;
