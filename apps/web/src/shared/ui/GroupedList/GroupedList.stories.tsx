import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Switch, Text } from '@mantine/core';
import {
  BellIcon,
  EnvelopeSimpleIcon,
  KeyIcon,
  PencilSimpleIcon,
  TrashIcon,
  UserIcon,
} from '@phosphor-icons/react';
import SkeletonCompare from '@/shared/storybook/SkeletonCompare';
import GroupedList from '.';

const META = {
  title: 'UI/GroupedList',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Шапка, строки, подвал',
  render: () => (
    <Box p="md" maw={560}>
      <GroupedList label="Аккаунт">
        <GroupedList.Header
          icon={<UserIcon />}
          title="tanuki_admin"
          description="Администратор"
          actionProps={{ children: 'Выйти' }}
        />
        <GroupedList.Row
          icon={<EnvelopeSimpleIcon />}
          title="Почта"
          description="admin@tanuki.local"
          actionProps={{ children: 'Сменить', leftSection: <PencilSimpleIcon /> }}
        />
        <GroupedList.Row
          icon={<KeyIcon />}
          title="Пароль"
          description="••••••••"
          actionProps={{ children: 'Сменить', leftSection: <PencilSimpleIcon /> }}
        />
        <GroupedList.Row
          icon={<BellIcon />}
          title="Push на этом устройстве"
          description="Недоступно в этом браузере"
          action={<Switch disabled />}
          isActionCompact
          disabled
        />
        <GroupedList.Footer>
          <Text fz={12} c="dimmed">
            Подвал списка — пояснение под строками.
          </Text>
        </GroupedList.Footer>
      </GroupedList>
    </Box>
  ),
};

export const Danger: Story = {
  name: 'Опасная зона',
  render: () => (
    <Box p="md" maw={560}>
      <GroupedList label="Опасная зона" color="red">
        <GroupedList.Row
          icon={<TrashIcon />}
          title="Удалить аккаунт"
          description="Аккаунт удалится через 14 дней — до этого удаление можно отменить"
          actionProps={{
            children: 'Удалить',
            color: 'red',
            variant: 'muted',
            leftSection: <TrashIcon />,
          }}
        />
      </GroupedList>
    </Box>
  ),
};

export const Loading: Story = {
  name: 'Загрузка',
  render: () => (
    <Box p="md" maw={560}>
      <GroupedList label="Сеансы" loading skeletonRows={3} />
    </Box>
  ),
};

export const RowWithSkeleton: Story = {
  name: 'Строка рядом со скелетоном',
  render: () => (
    <SkeletonCompare
      w={420}
      item={
        <GroupedList label="Аккаунт">
          <GroupedList.Row
            icon={<EnvelopeSimpleIcon />}
            title="Почта"
            description="admin@tanuki.local"
            actionProps={{ children: 'Сменить', leftSection: <PencilSimpleIcon /> }}
          />
        </GroupedList>
      }
      skeleton={<GroupedList label="Аккаунт" loading skeletonRows={1} />}
    />
  ),
};

export const Empty: Story = {
  name: 'Пусто',
  render: () => (
    <Box p="md" maw={560}>
      <GroupedList label="Сеансы" empty="Других сеансов нет" />
    </Box>
  ),
};

export const WithAside: Story = {
  name: 'Боковой блок',
  render: () => (
    <Box p="md">
      <GroupedList
        label="Аккаунт"
        aside={
          <GroupedList.Header
            isAside
            icon={<KeyIcon />}
            color="teal"
            title={
              <Text inherit ff="monospace">
                tanuki_admin
              </Text>
            }
            description="Один аккаунт для всех сайтов справа"
          />
        }
      >
        <GroupedList.Row icon={<KeyIcon />} title="Первый сайт" description="Чтение глав" />
        <GroupedList.Row icon={<KeyIcon />} title="Второй сайт" description="Импорт закладок" />
      </GroupedList>
    </Box>
  ),
};
