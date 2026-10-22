import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import OfflineEmptyState from './OfflineEmptyState';

const META = {
  title: 'UI/OfflineEmptyState',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Нет сети',
  render: () => (
    <Box p="md">
      <OfflineEmptyState />
    </Box>
  ),
};

export const WithText: Story = {
  name: 'Свой заголовок и описание',
  render: () => (
    <Box p="md">
      <OfflineEmptyState
        title="Глава не скачана"
        description="Без сети открываются только скачанные главы."
      />
    </Box>
  ),
};
