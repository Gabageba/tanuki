import { Group } from '@mantine/core';
import UserAvatar from './UserAvatar';
import AccountCardText from './AccountCardText';
import type { MockUser } from '../models';

type Props = {
  user: MockUser;
  withRole?: boolean;
  avatarSize?: number;
};

/** Некликабельная карточка аккаунта: аватар, имя, почта. */
function AccountCard({ user, withRole, avatarSize = 40 }: Props) {
  return (
    <Group gap="sm" wrap="nowrap" miw={0} flex={1}>
      <UserAvatar user={user} size={avatarSize} />
      <AccountCardText user={user} withRole={withRole} />
    </Group>
  );
}

export default AccountCard;
