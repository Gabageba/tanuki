import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import FormErrorAlert from './FormErrorAlert';

const META = {
  title: 'UI/FormErrorAlert',
  render: () => (
    <Box p="md" w={380}>
      <FormErrorAlert error="Слишком много попыток входа. Попробуйте через 10 минут." />
    </Box>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Ошибка формы' };
