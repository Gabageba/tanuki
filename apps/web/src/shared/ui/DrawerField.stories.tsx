import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Text } from '@mantine/core';
import DrawerField from './DrawerField';
import Mdash from './Mdash';

const META = {
  title: 'UI/DrawerField',
  render: () => (
    <Stack gap="sm" p="md" w={380}>
      <DrawerField label="Регистрация">
        <Text fz="sm" ff="monospace">
          05.03.2026
        </Text>
      </DrawerField>
      <DrawerField label="Пригласил">
        <Mdash c="dimmed" />
      </DrawerField>
    </Stack>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Поля карточки' };
