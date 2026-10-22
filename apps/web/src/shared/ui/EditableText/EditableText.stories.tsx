import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { fn } from 'storybook/test';
import EditableText from '.';

const META = {
  title: 'UI/EditableText',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Имя с карандашом',
  render: () => (
    <Box p="md">
      <EditableText
        order={2}
        value="tanuki_admin"
        maxLength={24}
        onSave={fn().mockName('onSave')}
        validate={(value) => (value.length < 3 ? 'Не короче 3 символов' : null)}
      />
    </Box>
  ),
};
