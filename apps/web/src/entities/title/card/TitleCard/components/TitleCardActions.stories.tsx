import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from '@mantine/core';
import { FolderSimpleIcon } from '@phosphor-icons/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { clickFirstButton } from '@/shared/storybook/play';
import TitleCardActions from './TitleCardActions';

const ON_ACTION = fn();

const META = {
  title: 'Меню/TitleCardActions',
  component: TitleCardActions,
  args: {
    actions: [
      {
        id: 'moveToFolder',
        children: 'Переместить в папку',
        leftSection: <FolderSimpleIcon />,
        onClick: ON_ACTION,
      },
    ],
  },
} satisfies Meta<typeof TitleCardActions>;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Открытое меню',
  play: async (context) => {
    await clickFirstButton(context);
    await waitFor(async () => {
      await expect(within(document.body).getByRole('menu')).toBeVisible();
    });
  },
};

export const Empty: Story = {
  name: 'Пустой массив скрывает кнопку',
  args: { actions: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
  },
};

export const KeepOpen: Story = {
  name: 'Свойства Mantine: правая секция и меню остаётся открытым',
  args: {
    actions: [
      {
        id: 'moveToFolder',
        children: 'Переместить в папку',
        leftSection: <FolderSimpleIcon />,
        rightSection: (
          <Text span ff="monospace" fz="xs">
            ⌘K
          </Text>
        ),
        onClick: ON_ACTION,
        closeMenuOnClick: false,
      },
    ],
  },
  play: async (context) => {
    ON_ACTION.mockClear();
    await clickFirstButton(context);
    const body = within(document.body);
    const item = await body.findByRole('menuitem');
    await waitFor(async () => {
      await expect(item).toBeVisible();
    });
    await userEvent.click(item);
    await expect(ON_ACTION).toHaveBeenCalledTimes(1);
    await expect(body.getByRole('menu')).toBeVisible();
    await expect(within(item).getByText('⌘K')).toBeVisible();
  },
};
