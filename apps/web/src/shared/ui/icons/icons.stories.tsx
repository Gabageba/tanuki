import type { Meta, StoryObj } from '@storybook/react-vite';
import { Group, Stack, Text } from '@mantine/core';
import { SORT_DIRECTION } from '@tanuki/contracts';
import SortDirectionIcon from '@/shared/ui/SortCombobox/SortDirectionIcon';
import SortCaretsIcon from '@/shared/ui/SortCaretsIcon';
import CheckboxMinusIcon from './CheckboxMinusIcon';
import CheckboxPlusIcon from './CheckboxPlusIcon';

/** Свои иконки приложения — то, чего нет в Phosphor или что собрано из его иконок. */
const ICONS = [
  { label: 'CheckboxPlusIcon', icon: <CheckboxPlusIcon className="" /> },
  { label: 'CheckboxMinusIcon', icon: <CheckboxMinusIcon className="" /> },
  { label: 'SortCaretsIcon: не активен', icon: <SortCaretsIcon direction={null} /> },
  {
    label: 'SortCaretsIcon: по возрастанию',
    icon: <SortCaretsIcon direction={SORT_DIRECTION.ASC} />,
  },
  {
    label: 'SortCaretsIcon: по убыванию',
    icon: <SortCaretsIcon direction={SORT_DIRECTION.DESC} />,
  },
  {
    label: 'SortDirectionIcon: по возрастанию',
    icon: <SortDirectionIcon direction={SORT_DIRECTION.ASC} />,
  },
  {
    label: 'SortDirectionIcon: по убыванию',
    icon: <SortDirectionIcon direction={SORT_DIRECTION.DESC} />,
  },
];

const META = {
  title: 'UI/Иконки',
  render: () => (
    <Stack p="md" gap="sm">
      {ICONS.map(({ label, icon }) => (
        <Group key={label} gap="md">
          <Group w={24} h={24} justify="center" fz={18}>
            {icon}
          </Group>
          <Text fz="sm" ff="monospace">
            {label}
          </Text>
        </Group>
      ))}
    </Stack>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const All: Story = { name: 'Все свои иконки' };
