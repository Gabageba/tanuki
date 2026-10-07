import { Button } from '@mantine/core';
import { CaretRightIcon } from '@phosphor-icons/react';
import UserAvatar from './UserAvatar';
import AccountCardText from './AccountCardText';
import type { MockUser } from '../models';

type Props = {
  user: MockUser;
};

/** Карточка аккаунта tile-кнопкой в мобильном меню — ведёт в профиль. */
function SheetAccountButton({ user }: Props) {
  return (
    <Button
      variant="tile"
      justify="flex-start"
      size="md"
      fullWidth
      h="auto"
      py="sm"
      leftSection={<UserAvatar user={user} size={40} />}
      rightSection={<CaretRightIcon size={16} color="var(--mantine-color-dimmed)" />}
      styles={{ label: { flex: 1, minWidth: 0 }, inner: { justifyContent: 'flex-start' } }}
    >
      <AccountCardText user={user} />
    </Button>
  );
}

export default SheetAccountButton;
