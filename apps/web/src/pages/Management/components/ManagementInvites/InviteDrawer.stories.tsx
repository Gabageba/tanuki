import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { INVITE, USED_INVITE } from '@/shared/storybook/fixtures';
import ModalStage from '@/shared/storybook/ModalStage';
import InviteDrawer from './InviteDrawer';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';

const META = {
  title: 'Дроверы/Управление/InviteDrawer',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const OwnActive: Story = {
  name: 'Своё активное',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <InviteDrawer
          invite={opened ? INVITE : null}
          isOwn
          permissions={{ canRevoke: true, canReissue: true }}
          isReissuing={false}
          onRevoke={fn().mockName('onRevoke')}
          onReissue={fn().mockName('onReissue')}
          onClose={close}
        />
      )}
    </ModalStage>
  ),
};

export const Used: Story = {
  name: 'Использованное, без действий',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <InviteDrawer
          invite={opened ? USED_INVITE : null}
          isOwn={false}
          permissions={{ canRevoke: false, canReissue: false }}
          isReissuing={false}
          onRevoke={fn().mockName('onRevoke')}
          onReissue={fn().mockName('onReissue')}
          onClose={close}
        />
      )}
    </ModalStage>
  ),
};

export const Mobile: Story = {
  ...OwnActive,
  name: 'На телефоне',
  globals: MOBILE_GLOBALS,
};
