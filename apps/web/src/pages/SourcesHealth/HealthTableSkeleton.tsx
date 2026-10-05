import { Group, Skeleton, Stack, Table } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { HEALTH_COLUMN_WIDTH } from './models';

const ROWS_COUNT = 5;

/** Заглушка таблицы здоровья на время загрузки — те же столбцы, строки из плашек. */
function HealthTableSkeleton() {
  const { t } = useTranslation();

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table layout="fixed" verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={HEALTH_COLUMN_WIDTH.SOURCE}>{t('source')}</Table.Th>
            <Table.Th w={HEALTH_COLUMN_WIDTH.STATUS}>{t('status')}</Table.Th>
            <Table.Th w={HEALTH_COLUMN_WIDTH.CHECK}>{t('check')}</Table.Th>
            <Table.Th w={HEALTH_COLUMN_WIDTH.REASON}>{t('reason')}</Table.Th>
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
              <Table.Td>
                <Stack gap={2}>
                  <TextSkeleton fz="xs" w="70%" />
                  <TextSkeleton fz="xs" lines={2} />
                </Stack>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default HealthTableSkeleton;
