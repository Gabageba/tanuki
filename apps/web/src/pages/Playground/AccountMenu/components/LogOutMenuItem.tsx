import { Menu } from '@mantine/core';
import { SignOutIcon } from '@phosphor-icons/react';

function LogOutMenuItem() {
  return (
    <Menu.Item color="red" leftSection={<SignOutIcon />}>
      Выйти
    </Menu.Item>
  );
}

export default LogOutMenuItem;
