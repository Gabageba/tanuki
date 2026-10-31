import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio, Stack } from '@mantine/core';
import RadioCardOption from './RadioCardOption';

const META = {
  title: 'UI/RadioCardOption',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Варианты карточками',
  render: () => (
    <Radio.Group defaultValue="keepMine" p="md" maw={420}>
      <Stack gap="xs">
        <RadioCardOption
          value="keepMine"
          title="Оставить мои"
          description="Тайтлы останутся в своих папках"
        />
        <RadioCardOption
          value="fromBackup"
          title="Взять из копии"
          description="Тайтлы переедут в папки из копии, а длинное пояснение переносится на следующую строку"
        />
      </Stack>
    </Radio.Group>
  ),
};
