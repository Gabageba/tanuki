import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box } from '@mantine/core';
import { ShieldIcon } from '@phosphor-icons/react';
import CompactMultiSelect from './CompactMultiSelect';

const DATA = ['Администратор', 'Модератор', 'Пользователь'];

const META = {
  title: 'UI/CompactMultiSelect',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Первый выбранный и +N',
  render: function Render() {
    const [value, setValue] = useState(['Модератор', 'Пользователь']);
    return (
      <Box p="md" w={260}>
        <CompactMultiSelect
          data={DATA}
          value={value}
          onChange={setValue}
          placeholder="Все роли"
          leftSection={<ShieldIcon />}
        />
      </Box>
    );
  },
};

export const Empty: Story = {
  name: 'Ничего не выбрано — без ограничения',
  render: function Render() {
    const [value, setValue] = useState<string[]>([]);
    return (
      <Box p="md" w={260}>
        <CompactMultiSelect
          data={DATA}
          value={value}
          onChange={setValue}
          placeholder="Все роли"
          leftSection={<ShieldIcon />}
        />
      </Box>
    );
  },
};

export const SingleValue: Story = {
  name: 'Один короткий тег в широком поле',
  render: function Render() {
    const [value, setValue] = useState(['Модератор']);
    return (
      <Box p="md" w="100%" maw={390}>
        <CompactMultiSelect
          data={DATA}
          value={value}
          onChange={setValue}
          placeholder="Все роли"
          leftSection={<ShieldIcon />}
          clearable
        />
      </Box>
    );
  },
};

export const LongValue: Story = {
  name: 'Длинный тег и +N в узком поле',
  render: function Render() {
    const [value, setValue] = useState(['Администратор с длинным названием роли', 'Модератор']);
    return (
      <Box p="md" w={260}>
        <CompactMultiSelect
          data={[...DATA, 'Администратор с длинным названием роли']}
          value={value}
          onChange={setValue}
          placeholder="Все роли"
          leftSection={<ShieldIcon />}
          clearable
        />
      </Box>
    );
  },
};
