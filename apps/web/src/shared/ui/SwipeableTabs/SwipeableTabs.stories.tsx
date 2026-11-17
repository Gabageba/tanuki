import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Scroller, Skeleton, Stack, Tabs, Text } from '@mantine/core';
import { BookOpenIcon, GearIcon, ListIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import SearchInput from '@/shared/ui/SearchInput';
import QueryBlock from '@/shared/ui/QueryBlock';
import SwipeableTabs from './index';

const META = {
  title: 'UI/SwipeableTabs',
  component: SwipeableTabs,
} satisfies Meta<typeof SwipeableTabs>;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Свайпы и недоступная вкладка',
  render: function Render() {
    const TABS = useMemo(
      () => [
        { id: 'books', title: 'Книги', icon: <BookOpenIcon />, content: 'Список книг' },
        {
          id: 'settings',
          title: 'Недоступно',
          icon: <GearIcon />,
          content: 'Недоступная вкладка',
          disabled: true,
        },
        { id: 'chapters', title: 'Главы', icon: <ListIcon />, content: 'Список глав' },
      ],
      [],
    );

    return (
      <Box p="md" maw={600}>
        <SwipeableTabs defaultValue="books">
          <Tabs.List>
            <Scroller>
              {TABS.map(({ id, title, icon, disabled }) => (
                <Tabs.Tab key={id} value={id} leftSection={icon} disabled={disabled}>
                  {title}
                </Tabs.Tab>
              ))}
            </Scroller>
          </Tabs.List>
          {TABS.map(({ id, content }) => (
            <Tabs.Panel key={id} value={id} pt="md">
              <Stack mih={240}>
                <Text>{content}</Text>
                <Text c="dimmed">Смахните содержимое влево или вправо.</Text>
                <SearchInput placeholder="Поиск" />
                <Box style={{ overflowX: 'auto' }}>
                  <Text w={900}>Эта область прокручивается вбок и не переключает вкладки.</Text>
                </Box>
              </Stack>
            </Tabs.Panel>
          ))}
        </SwipeableTabs>
      </Box>
    );
  },
};

export const Mobile: Story = {
  ...Default,
  name: 'На телефоне',
  globals: MOBILE_GLOBALS,
};

export const DelayedControlled: Story = {
  name: 'Медленное обновление страницы: мгновенный выбор',
  globals: MOBILE_GLOBALS,
  render: function Render() {
    const [value, setValue] = useState<string | null>('books');
    const TABS = useMemo(
      () => [
        { id: 'books', title: 'Книги', icon: <BookOpenIcon />, content: 'Список книг' },
        { id: 'chapters', title: 'Главы', icon: <ListIcon />, content: 'Список глав' },
        { id: 'settings', title: 'Настройки', icon: <GearIcon />, content: 'Настройки книг' },
      ],
      [],
    );
    const handleChange = async (next: string | null) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setValue(next);
    };

    return (
      <Box p="md">
        <SwipeableTabs value={value} onChange={handleChange}>
          <Tabs.List>
            <Scroller>
              {TABS.map(({ id, title, icon }) => (
                <Tabs.Tab key={id} value={id} leftSection={icon}>
                  {title}
                </Tabs.Tab>
              ))}
            </Scroller>
          </Tabs.List>
          {TABS.map(({ id, content }) => (
            <Tabs.Panel key={id} value={id} pt="md" mih={300}>
              <QueryBlock
                query={{
                  data: content,
                  isError: false,
                  error: null,
                  isPlaceholderData: false,
                  fetchStatus: 'idle',
                  refetch: () => undefined,
                }}
                skeleton={<Skeleton h={120} />}
              >
                {(data) => <Text>{data}</Text>}
              </QueryBlock>
            </Tabs.Panel>
          ))}
        </SwipeableTabs>
      </Box>
    );
  },
};
