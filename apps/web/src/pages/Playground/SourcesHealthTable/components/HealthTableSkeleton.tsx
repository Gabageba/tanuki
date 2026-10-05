import { Group, Skeleton, Stack, Table } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { COLUMN_WIDTH, TABLE_LAYOUT, type TableLayout } from '../models';
import { getExtraColumnTitle, hasExtraColumn } from '../lib';

type Props = {
  layout: TableLayout;
};

const ROWS_COUNT = 5;

/** Заглушка на время загрузки — та же раскладка, что у HealthTable. */
function HealthTableSkeleton({ layout }: Props) {
  const withExtraColumn = hasExtraColumn(layout);
  const extraColumnTitle = getExtraColumnTitle(layout);
  const width = withExtraColumn ? COLUMN_WIDTH.WIDE : COLUMN_WIDTH.NARROW;

  return (
    <Table.ScrollContainer minWidth={withExtraColumn ? 760 : 620}>
      <Table layout="fixed" verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={width.SOURCE}>Источник</Table.Th>
            <Table.Th w={width.STATUS}>Статус</Table.Th>
            <Table.Th w={width.PROBE}>Проверка</Table.Th>
            {extraColumnTitle && (
              <Table.Th w={COLUMN_WIDTH.WIDE.EXTRA}>{extraColumnTitle}</Table.Th>
            )}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: ROWS_COUNT }).map((_, index) => (
            <Table.Tr key={index}>
              <Table.Td>
                <Group gap="sm" wrap="nowrap">
                  <Skeleton h={32} w={32} radius="md" flex="none" />
                  <Stack gap={0} flex={1}>
                    <TextSkeleton fz="sm" w="50%" />
                    <TextSkeleton fz="xs" w="70%" />
                  </Stack>
                </Group>
              </Table.Td>
              <Table.Td>
                <Stack gap={2}>
                  <Skeleton h={20} w={90} radius="sm" />
                  <TextSkeleton fz="xs" w={90} />
                </Stack>
              </Table.Td>
              <Table.Td>
                <TextSkeleton fz="sm" w={80} />
              </Table.Td>
              {layout === TABLE_LAYOUT.ERROR_COLUMN && (
                <Table.Td>
                  <TextSkeleton fz="xs" lines={2} />
                </Table.Td>
              )}
              {layout === TABLE_LAYOUT.REASON_COLUMN && (
                <Table.Td>
                  <Stack gap={2}>
                    <TextSkeleton fz="xs" w="70%" />
                    <TextSkeleton fz="xs" lines={2} />
                  </Stack>
                </Table.Td>
              )}
              {layout === TABLE_LAYOUT.NIGHTS_STRIP && (
                <Table.Td>
                  <Stack gap={4}>
                    <Skeleton h={18} />
                    <TextSkeleton fz="xs" w={90} />
                  </Stack>
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default HealthTableSkeleton;
