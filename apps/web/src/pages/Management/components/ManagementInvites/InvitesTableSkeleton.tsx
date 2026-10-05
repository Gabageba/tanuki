import { Skeleton, Stack, Table } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { INVITES_COLUMN_WIDTH } from './models';

const ROWS_COUNT = 5;

/** Заглушка таблицы приглашений на время загрузки — те же столбцы, строки из плашек. */
function InvitesTableSkeleton() {
  const { t } = useTranslation();

  return (
    <Table.ScrollContainer minWidth={720}>
      <Table layout="fixed" verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={INVITES_COLUMN_WIDTH.ROLE}>{t('role')}</Table.Th>
            <Table.Th w={INVITES_COLUMN_WIDTH.CREATED_BY}>{t('createdBy')}</Table.Th>
            <Table.Th w={INVITES_COLUMN_WIDTH.STATUS}>{t('status')}</Table.Th>
            <Table.Th w={INVITES_COLUMN_WIDTH.RESULT}>{t('result')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: ROWS_COUNT }).map((_, index) => (
            <Table.Tr key={index}>
              <Table.Td>
                <Skeleton h={20} w={90} radius="sm" />
              </Table.Td>
              <Table.Td>
                <Stack gap={2}>
                  <TextSkeleton fz="sm" w={100} />
                  <TextSkeleton fz="xs" w={70} />
                </Stack>
              </Table.Td>
              <Table.Td>
                <Skeleton h={20} w={90} radius="sm" />
              </Table.Td>
              <Table.Td>
                <Stack gap={2}>
                  <TextSkeleton fz="sm" w={140} />
                  <TextSkeleton fz="xs" w={70} />
                </Stack>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default InvitesTableSkeleton;
