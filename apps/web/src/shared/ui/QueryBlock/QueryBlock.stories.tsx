import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, EmptyState, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { ArrowsClockwiseIcon, ListIcon } from '@phosphor-icons/react';
import { fn } from 'storybook/test';
import QueryBlock from '.';
import type { LoadingQuery } from './models';

const META = {
  title: 'UI/QueryBlock',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

const ITEMS = ['Берсерк', 'Монстр', 'Башня бога'];

/** Сколько «идёт» запрос в истории с задержкой — дольше 200 мс, чтобы скелетон успел показаться. */
const REQUEST_MS = 1_000;

const getQuery = (overrides: Partial<LoadingQuery<string[]>> = {}): LoadingQuery<string[]> => ({
  data: ITEMS,
  isError: false,
  error: null,
  isPlaceholderData: false,
  fetchStatus: 'idle',
  refetch: fn().mockName('refetch'),
  ...overrides,
});

const SKELETON = (
  <Stack gap="xs">
    {ITEMS.map((item) => (
      <Skeleton key={item} h={46} />
    ))}
  </Stack>
);

const EMPTY = <EmptyState icon={<ListIcon />} title="Список пуст" />;

const renderItems = (items: string[]) => (
  <Stack gap="xs">
    {items.map((item) => (
      <Paper key={item} withBorder p="sm">
        <Text fz="sm">{item}</Text>
      </Paper>
    ))}
  </Stack>
);

const renderBlock = (query: LoadingQuery<string[]>) => (
  <Stack p="md" maw={480}>
    <QueryBlock query={query} skeleton={SKELETON} empty={EMPTY}>
      {renderItems}
    </QueryBlock>
  </Stack>
);

/** Смена параметров: старые данные остаются (`isPlaceholderData`), через 200 мс — скелетон, держится
 *  до ответа, но не меньше 400 мс. */
function DelayDemo() {
  const [isFetching, setIsFetching] = useState(false);

  const handleRefetch = () => {
    setIsFetching(true);
    setTimeout(() => setIsFetching(false), REQUEST_MS);
  };

  return (
    <Stack p="md" maw={480}>
      <Button w="fit-content" leftSection={<ArrowsClockwiseIcon />} onClick={handleRefetch}>
        Сменить параметры
      </Button>
      <QueryBlock
        query={getQuery({
          isPlaceholderData: isFetching,
          fetchStatus: isFetching ? 'fetching' : 'idle',
        })}
        skeleton={SKELETON}
        empty={EMPTY}
      >
        {renderItems}
      </QueryBlock>
    </Stack>
  );
}

export const Content: Story = {
  name: 'Данные',
  render: () => renderBlock(getQuery()),
};

export const Loading: Story = {
  name: 'Загрузка',
  render: () => renderBlock(getQuery({ data: undefined, fetchStatus: 'fetching' })),
};

export const Delay: Story = {
  name: 'Смена параметров',
  render: () => <DelayDemo />,
};

export const Offline: Story = {
  name: 'Нет соединения',
  render: () => renderBlock(getQuery({ data: undefined, fetchStatus: 'paused' })),
};

export const Failed: Story = {
  name: 'Ошибка',
  render: () =>
    renderBlock(
      getQuery({ data: undefined, isError: true, error: new Error('Сервер не ответил') }),
    ),
};
