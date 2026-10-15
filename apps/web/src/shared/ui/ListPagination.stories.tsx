import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box } from '@mantine/core';
import ListPagination from './ListPagination';

const META = {
  title: 'UI/ListPagination',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Счётчик и страницы',
  render: function Render() {
    const [page, setPage] = useState(2);
    return (
      <Box p="md">
        <ListPagination page={page} total={87} pageSize={10} onChange={setPage} />
      </Box>
    );
  },
};

export const SinglePage: Story = {
  name: 'Всё на одной странице — ничего',
  render: () => (
    <Box p="md">
      <ListPagination page={1} total={7} pageSize={10} onChange={() => undefined} />
    </Box>
  ),
};
