import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import { COMPARISON_LAYOUT } from '../models';
import MatchesDemo from './MatchesDemo';

const META = {
  title: 'Модалки/Песочница/Сравнение связей',
  component: MatchesDemo,
  args: { layout: COMPARISON_LAYOUT.MODAL, isPhone: false },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    const buttons = await within(canvasElement).findAllByRole('button', { name: /Сравнить «/ });
    await waitFor(() => expect(buttons[1]!).toBeEnabled());
    await userEvent.click(buttons[1]!);
  },
} satisfies Meta<typeof MatchesDemo>;

export default META;
type Story = StoryObj<typeof META>;

export const Modal: Story = { name: 'Окно сравнения' };
export const ModalMobile: Story = {
  name: 'Полноэкранное сравнение',
  args: { isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const Drawer: Story = { name: 'Боковая панель', args: { layout: COMPARISON_LAYOUT.DRAWER } };
export const DrawerMobile: Story = {
  name: 'Панель снизу',
  args: { layout: COMPARISON_LAYOUT.DRAWER, isPhone: true },
  globals: MOBILE_GLOBALS,
};
export const RegularUser: Story = {
  name: 'Без прав на подтверждение',
  args: { isStaff: false },
  play: undefined,
};
export const Empty: Story = { name: 'Нет совпадений', args: { isEmpty: true }, play: undefined };
