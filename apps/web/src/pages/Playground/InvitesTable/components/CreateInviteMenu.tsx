import { useState } from 'react';
import { Button, Menu } from '@mantine/core';
import { CaretDownIcon, PlusIcon, ShieldCheckIcon, UserIcon } from '@phosphor-icons/react';
import { USER_ROLE, type InvitableRole } from '@tanuki/contracts';
import { getInvitableRoles, getRoleLabel } from '../lib';
import type { MockInvite, Viewer } from '../models';
import InviteCreatedModal from './InviteCreatedModal';

type Props = {
  viewer: Viewer;
  onCreate: (role: InvitableRole) => MockInvite;
};

const getRoleIcon = (role: InvitableRole) => {
  switch (role) {
    case USER_ROLE.USER:
      return <UserIcon />;
    case USER_ROLE.MODERATOR:
      return <ShieldCheckIcon />;
  }
};

/** C3: без шага выбора. Роль — пунктом меню у кнопки, окно сразу с готовой ссылкой. У
 *  модератора роль одна — меню нет, кнопка создаёт сразу. */
function CreateInviteMenu({ viewer, onCreate }: Props) {
  const [created, setCreated] = useState<MockInvite | null>(null);
  const roles = getInvitableRoles(viewer);

  return (
    <>
      {roles.length > 1 ? (
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <Button leftSection={<PlusIcon />} rightSection={<CaretDownIcon />}>
              Создать приглашение
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Роль приглашённого</Menu.Label>
            {roles.map((role) => (
              <Menu.Item
                key={role}
                leftSection={getRoleIcon(role)}
                onClick={() => setCreated(onCreate(role))}
              >
                {getRoleLabel(role)}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      ) : (
        <Button leftSection={<PlusIcon />} onClick={() => setCreated(onCreate(USER_ROLE.USER))}>
          Создать приглашение
        </Button>
      )}

      <InviteCreatedModal invite={created} onClose={() => setCreated(null)} />
    </>
  );
}

export default CreateInviteMenu;
