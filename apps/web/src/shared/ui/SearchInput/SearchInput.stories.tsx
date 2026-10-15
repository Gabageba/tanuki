import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { fn } from 'storybook/test';
import SearchInput from '.';

const META = {
  title: 'UI/SearchInput',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Empty: Story = {
  name: 'Пустое',
  render: () => (
    <Box p="md" w={360}>
      <SearchInput placeholder="Поиск по названию" handleSearch={fn().mockName('handleSearch')} />
    </Box>
  ),
};

export const WithQuery: Story = {
  name: 'С запросом и крестиком',
  render: () => (
    <Box p="md" w={360}>
      <SearchInput
        placeholder="Поиск по названию"
        defaultValue="берсерк"
        allowClear
        handleSearch={fn().mockName('handleSearch')}
      />
    </Box>
  ),
};
