import type { ReactNode } from 'react';
import { Group, Skeleton, Stack, Table } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { getOutcomeColumnTitle } from '../lib';
import { TABLE_LAYOUT, type OutcomeColumn, type TableLayout } from '../models';

type Props = {
  layout: TableLayout;
  outcome: OutcomeColumn;
};

type Column = {
  title: string;
  cell: ReactNode;
};

const ROWS_COUNT = 5;

const BADGE = <Skeleton h={20} w={90} radius="sm" />;
const NAME = <TextSkeleton fz="sm" w={100} />;
const DATE = <TextSkeleton fz="sm" w={80} />;
const TWO_LINES = (
  <Stack gap={2}>
    <TextSkeleton fz="xs" w={140} />
    <TextSkeleton fz="xs" w={120} />
  </Stack>
);

/** Те же столбцы, что у выбранной раскладки, строки — из плашек. */
const getColumns = (layout: TableLayout, outcome: OutcomeColumn): Column[] => {
  switch (layout) {
    case TABLE_LAYOUT.CURRENT:
      return [
        { title: 'Роль', cell: <TextSkeleton fz="sm" w={90} /> },
        { title: 'Статус', cell: BADGE },
        { title: 'Создал', cell: NAME },
        { title: 'Использовал', cell: NAME },
        { title: 'Истекает', cell: DATE },
        { title: '', cell: null },
      ];
    case TABLE_LAYOUT.SEPARATE:
      return [
        { title: 'Роль', cell: BADGE },
        { title: 'Статус', cell: BADGE },
        { title: 'Создал', cell: NAME },
        { title: 'Использовал', cell: NAME },
        { title: 'Создано', cell: DATE },
        { title: 'Истекает', cell: DATE },
      ];
    case TABLE_LAYOUT.MERGED:
      return [
        {
          title: 'Приглашение',
          cell: (
            <Stack gap={4}>
              {BADGE}
              <TextSkeleton fz="xs" w={110} />
            </Stack>
          ),
        },
        {
          title: 'Статус',
          cell: (
            <Stack gap={2}>
              {BADGE}
              <TextSkeleton fz="xs" w={80} />
            </Stack>
          ),
        },
        {
          title: 'Использовал',
          cell: (
            <Group gap="xs" wrap="nowrap">
              <Skeleton h={24} w={24} circle flex="none" />
              {NAME}
            </Group>
          ),
        },
        { title: 'Даты', cell: TWO_LINES },
      ];
    case TABLE_LAYOUT.OUTCOME: {
      const outcomeTitle = getOutcomeColumnTitle(outcome);
      return [
        { title: 'Роль', cell: BADGE },
        {
          title: 'Создал',
          cell: (
            <Stack gap={2}>
              {NAME}
              <TextSkeleton fz="xs" w={70} />
            </Stack>
          ),
        },
        ...(outcomeTitle
          ? [
              { title: 'Статус', cell: BADGE },
              { title: outcomeTitle, cell: TWO_LINES },
            ]
          : [
              {
                title: 'Статус',
                cell: (
                  <Stack gap={6}>
                    {BADGE}
                    {TWO_LINES}
                  </Stack>
                ),
              },
            ]),
      ];
    }
  }
};

function InvitesTableSkeleton({ layout, outcome }: Props) {
  const columns = getColumns(layout, outcome);

  return (
    <Table.ScrollContainer minWidth={720}>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            {columns.map(({ title }, index) => (
              <Table.Th key={index}>{title}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: ROWS_COUNT }).map((_, row) => (
            <Table.Tr key={row}>
              {columns.map(({ cell }, index) => (
                <Table.Td key={index}>{cell}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default InvitesTableSkeleton;
