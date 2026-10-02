import { Skeleton, Table } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import TextSkeleton from '@/shared/ui/TextSkeleton';

const ROWS_COUNT = 5;

/** Заглушка таблицы приглашений на время загрузки — те же колонки, строки из плашек. */
function InvitesTableSkeleton() {
  const { t } = useTranslation();

  return (
    <Table.ScrollContainer minWidth={720}>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('role')}</Table.Th>
            <Table.Th>{t('status')}</Table.Th>
            <Table.Th>{t('createdBy')}</Table.Th>
            <Table.Th>{t('usedBy')}</Table.Th>
            <Table.Th>{t('expires')}</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: ROWS_COUNT }).map((_, index) => (
            <Table.Tr key={index}>
              <Table.Td>
                <TextSkeleton fz="sm" w={90} />
              </Table.Td>
              <Table.Td>
                <Skeleton h={20} w={80} radius="xl" />
              </Table.Td>
              <Table.Td>
                <TextSkeleton fz="sm" w={100} />
              </Table.Td>
              <Table.Td>
                <TextSkeleton fz="sm" w={100} />
              </Table.Td>
              <Table.Td>
                <TextSkeleton fz="sm" w={80} />
              </Table.Td>
              <Table.Td />
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default InvitesTableSkeleton;
