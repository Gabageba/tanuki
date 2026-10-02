import { Group, Skeleton, Stack, Table } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import TextSkeleton from '@/shared/ui/TextSkeleton';

const ROWS_COUNT = 5;

/** Заглушка таблицы пользователей на время загрузки — повторяет раскладку ячеек UsersTable. */
function UsersTableSkeleton() {
  const { t } = useTranslation();

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('user')}</Table.Th>
            <Table.Th>{t('status')}</Table.Th>
            <Table.Th>{t('invitedBy')}</Table.Th>
            <Table.Th>{t('dates')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: ROWS_COUNT }).map((_, index) => (
            <Table.Tr key={index}>
              <Table.Td maw={300}>
                <Group gap="sm" wrap="nowrap">
                  <Skeleton h={32} w={32} flex="none" />
                  <Stack gap={0} flex={1}>
                    <TextSkeleton fz="sm" w="50%" />
                    <TextSkeleton fz="xs" w="80%" />
                  </Stack>
                </Group>
              </Table.Td>
              <Table.Td>
                <Skeleton h={20} w={80} radius="sm" />
              </Table.Td>
              <Table.Td>
                <TextSkeleton fz="sm" w={90} />
              </Table.Td>
              <Table.Td>
                <Stack gap={2}>
                  <TextSkeleton fz="xs" w={150} />
                  <TextSkeleton fz="xs" w={120} />
                </Stack>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default UsersTableSkeleton;
