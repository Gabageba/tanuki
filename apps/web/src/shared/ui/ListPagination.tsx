import { Group, Pagination, Text, useMatches } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  /** Текущая страница, с единицы. */
  page: number;
  /** Сколько всего записей. */
  total: number;
  /** Сколько записей на странице. */
  pageSize: number;
  onChange: (page: number) => void;
};

/** «11–20 из 23» слева, страницы справа; всё помещается на одну страницу — блока нет. */
function ListPagination({ page, total, pageSize, onChange }: Props) {
  const { t } = useTranslation();
  const siblings = useMatches({ base: 0, sm: 1 });
  const pages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (pages <= 1) {
    return null;
  }

  return (
    <Group justify="space-between" gap="xs">
      <Text fz="sm" c="dimmed" ff="monospace">
        {t('fromToOfTotal', { from, to, total })}
      </Text>
      <Pagination size="sm" total={pages} value={page} onChange={onChange} siblings={siblings} />
    </Group>
  );
}

export default ListPagination;
