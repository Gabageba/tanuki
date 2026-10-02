import { Group, Pagination, Text } from '@mantine/core';
import { PAGE_SIZE } from '../models';

type Props = {
  page: number;
  total: number;
  narrow: boolean;
  onChange: (page: number) => void;
};

/** «11–20 из 23» слева, страницы справа; одна страница — пагинации нет, остаётся только счётчик. */
function UsersPagination({ page, total, narrow, onChange }: Props) {
  const pages = Math.ceil(total / PAGE_SIZE);
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <Group justify="space-between" gap="xs">
      <Text fz="sm" c="dimmed" ff="monospace">
        {from}–{to} из {total}
      </Text>
      {pages > 1 && (
        <Pagination
          size="sm"
          total={pages}
          value={page}
          onChange={onChange}
          siblings={narrow ? 0 : 1}
        />
      )}
    </Group>
  );
}

export default UsersPagination;
