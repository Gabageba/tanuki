import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box } from '@mantine/core';
import { SORT_DIRECTION, type SortDirection } from '@tanuki/contracts';
import { clickFirstButton } from '@/shared/storybook/play';
import SortCombobox from '.';

const OPTIONS = [
  { value: 'updated', label: 'По обновлению' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'alphabetical', label: 'По алфавиту' },
];

const META = {
  title: 'UI/SortCombobox',
  play: clickFirstButton,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const WithDirection: Story = {
  name: 'Порядок и направление',
  render: function Render() {
    const [value, setValue] = useState('updated');
    const [direction, setDirection] = useState<SortDirection>(SORT_DIRECTION.DESC);
    return (
      <Box p="md" w={240}>
        <SortCombobox
          options={OPTIONS}
          value={value}
          onChange={setValue}
          direction={direction}
          onDirectionChange={setDirection}
        />
      </Box>
    );
  },
};

export const WithoutDirection: Story = {
  name: 'Без направления',
  render: function Render() {
    const [value, setValue] = useState('updated');
    return (
      <Box p="md" w={240}>
        <SortCombobox options={OPTIONS} value={value} onChange={setValue} />
      </Box>
    );
  },
};
