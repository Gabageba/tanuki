import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box, Table } from '@mantine/core';
import { CalendarBlankIcon, SignInIcon } from '@phosphor-icons/react';
import { SORT_DIRECTION, type SortDirection } from '@tanuki/contracts';
import SortableTh from '@/shared/ui/SortableTh';
import { clickFirstButton } from '@/shared/storybook/play';
import SortMenuTh from '.';

const META = {
  title: 'UI/SortMenuTh',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Составной столбец с меню и обычный',
  render: function Render() {
    const [sort, setSort] = useState('createdAt');
    const [direction, setDirection] = useState<SortDirection>(SORT_DIRECTION.DESC);
    const handleSortChange = (next: string) => {
      setDirection(
        next === sort && direction === SORT_DIRECTION.DESC
          ? SORT_DIRECTION.ASC
          : SORT_DIRECTION.DESC,
      );
      setSort(next);
    };
    return (
      <Box p="md">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <SortMenuTh
                title="Даты"
                options={[
                  {
                    sort: 'createdAt',
                    label: 'регистрация',
                    menuLabel: 'По дате регистрации',
                    icon: <CalendarBlankIcon />,
                  },
                  {
                    sort: 'lastSeenAt',
                    label: 'вход',
                    menuLabel: 'По дате входа',
                    icon: <SignInIcon />,
                  },
                ]}
                activeSort={sort}
                direction={direction}
                onSortChange={handleSortChange}
              />
              <SortableTh
                sort="status"
                activeSort={sort}
                direction={direction}
                onSortChange={handleSortChange}
              >
                Статус
              </SortableTh>
            </Table.Tr>
          </Table.Thead>
        </Table>
      </Box>
    );
  },
  play: clickFirstButton,
};
