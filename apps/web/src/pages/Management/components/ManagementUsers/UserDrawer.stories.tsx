import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { USER_STATUS, type ManagedUser, type UserManagementPermissions } from '@tanuki/contracts';
import {
  BLOCKED_USER,
  CURRENT_USER,
  MANAGED_USER,
  MODERATOR_USER,
} from '@/shared/storybook/fixtures';
import ModalStage from '@/shared/storybook/ModalStage';
import UserDrawer from './UserDrawer';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';

const ALL_PERMISSIONS: UserManagementPermissions = {
  canChangeRole: true,
  canBlock: true,
  canDelete: true,
};

const HANDLERS = {
  onOpen: fn().mockName('onOpen'),
  onRoleChange: fn().mockName('onRoleChange'),
  onBlock: fn().mockName('onBlock'),
  onUnblock: fn().mockName('onUnblock'),
  onDelete: fn().mockName('onDelete'),
};

const stageDrawer = (
  user: ManagedUser,
  permissions: UserManagementPermissions | null,
  isSelf = false,
) => (
  <ModalStage>
    {({ opened, close }) => (
      <UserDrawer
        user={opened ? user : null}
        isSelf={isSelf}
        permissions={permissions}
        isRoleChanging={false}
        isUnblocking={false}
        handlers={HANDLERS}
        onClose={close}
      />
    )}
  </ModalStage>
);

const META = {
  title: 'Дроверы/Управление/UserDrawer',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Active: Story = {
  name: 'Активный, все действия',
  render: () => stageDrawer(MANAGED_USER, ALL_PERMISSIONS),
};

export const Moderator: Story = {
  name: 'Модератор',
  render: () => stageDrawer(MODERATOR_USER, ALL_PERMISSIONS),
};

export const Blocked: Story = {
  name: 'Заблокирован',
  render: () => stageDrawer(BLOCKED_USER, ALL_PERMISSIONS),
};

export const Self: Story = {
  name: 'Это вы',
  render: () =>
    stageDrawer(
      { ...MANAGED_USER, ...CURRENT_USER, status: USER_STATUS.ACTIVE, invitedByUsername: null },
      null,
      true,
    ),
};

export const Mobile: Story = {
  ...Active,
  name: 'На телефоне',
  globals: MOBILE_GLOBALS,
};
