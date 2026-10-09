import { Button } from '@mantine/core';
import { CaretDownIcon } from '@phosphor-icons/react';
import ListPagination from '@/shared/ui/ListPagination';
import { PAGE_SIZE, PAGINATION, type Pagination } from '../models';
import FeedInfiniteTrigger from './FeedInfiniteTrigger';

type Props = {
  pagination: Pagination;
  page: number;
  total: number;
  visibleCount: number;
  onPageChange: (page: number) => void;
  onLoadMore: () => void;
};

/** Низ ленты: страницы, «Показать ещё» или бесконечная прокрутка. */
function FeedPagination({
  pagination,
  page,
  total,
  visibleCount,
  onPageChange,
  onLoadMore,
}: Props) {
  if (pagination === PAGINATION.PAGES) {
    return (
      <ListPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={onPageChange} />
    );
  }

  if (visibleCount >= total) {
    return null;
  }

  if (pagination === PAGINATION.INFINITE) {
    return <FeedInfiniteTrigger onLoadMore={onLoadMore} />;
  }

  return (
    <Button variant="default" leftSection={<CaretDownIcon />} onClick={onLoadMore}>
      Показать ещё
    </Button>
  );
}

export default FeedPagination;
