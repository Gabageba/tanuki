import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Button } from '@mantine/core';
import { CheckIcon } from '@phosphor-icons/react';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import ModalButtonsLayout from './ModalButtonsLayout';

const META = {
  title: 'UI/ModalButtonsLayout',
  render: () => (
    <Box p="md" maw={420}>
      <ModalButtonsLayout>
        <Button variant="default">Отмена</Button>
        <Button leftSection={<CheckIcon />}>Сохранить</Button>
      </ModalButtonsLayout>
    </Box>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Кнопки модалки' };

export const Mobile: Story = {
  name: 'На телефоне',
  globals: MOBILE_GLOBALS,
};
