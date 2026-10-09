import { use, useState, type ReactNode } from 'react';
import { Button, Flex, Stack, Title } from '@mantine/core';
import {
  getDismissAllIcon,
  getDismissAllLabel,
  getTypeCategory,
  getVisibleCategories,
} from '../lib';
import { MOCK_FEED } from '../mocks';
import {
  COUNTER,
  DISMISS,
  EMPTY,
  EMPTY_REASON,
  FILTER,
  LEADING,
  MOCK_ROLE,
  PAGE_SIZE,
  PAGINATION,
  PHONE_FRAME_CONTEXT,
  ROWS,
  type Counter,
  type Dismiss,
  type Empty,
  type Filter,
  type Leading,
  type MockCategory,
  type MockNotification,
  type Pagination,
  type Rows,
} from '../models';
import FeedEmpty from './FeedEmpty';
import FeedFilter from './FeedFilter';
import FeedPagination from './FeedPagination';
import FeedRows from './FeedRows';

type Props = {
  items?: MockNotification[];
  leading?: Leading;
  counter?: Counter;
  dismiss?: Dismiss;
  rows?: Rows;
  filter?: Filter;
  pagination?: Pagination;
  empty?: Empty;
  /** Блок над списком (предложение включить push). */
  top?: ReactNode;
  /** Начальный выбор фильтра. */
  initialSelected?: MockCategory[];
};

/** Страница `/notifications`: заголовок, фильтр и «Отметить все», список, страницы. Живая — строки
 *  убираются, фильтр и страницы работают. */
function FeedPageMock({
  items: initialItems = MOCK_FEED,
  leading = LEADING.COVER_AND_ICON,
  counter = COUNTER.WORDS,
  dismiss = DISMISS.CURRENT,
  rows = ROWS.LEGACY,
  filter = FILTER.SELECT,
  pagination = PAGINATION.PAGES,
  empty = EMPTY.BY_REASON,
  top,
  initialSelected = [],
}: Props) {
  const isPhone = use(PHONE_FRAME_CONTEXT);
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<MockCategory[]>(initialSelected);
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categories = getVisibleCategories(MOCK_ROLE.ADMIN);
  const filtered =
    selected.length === 0
      ? items
      : items.filter((item) => selected.includes(getTypeCategory(item.type)));
  const counts = categories.reduce<Partial<Record<MockCategory, number>>>(
    (acc, category) => ({
      ...acc,
      [category]: items.filter((item) => getTypeCategory(item.type) === category).length,
    }),
    {},
  );
  const shown =
    pagination === PAGINATION.PAGES
      ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      : filtered.slice(0, visibleCount);
  const loadMore = () => setVisibleCount((prev) => prev + PAGE_SIZE);

  const remove = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));
  const markAllRead = () =>
    setItems((prev) =>
      selected.length === 0
        ? []
        : prev.filter((item) => !selected.includes(getTypeCategory(item.type))),
    );
  const changeSelected = (next: MockCategory[]) => {
    setSelected(next);
    setPage(1);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <Stack gap="md">
      <Title order={3}>Уведомления</Title>
      {top}
      <Flex
        direction={isPhone ? 'column' : 'row'}
        gap="sm"
        align={isPhone ? 'stretch' : 'center'}
        justify="space-between"
      >
        <FeedFilter
          filter={filter}
          categories={categories}
          selected={selected}
          onChange={changeSelected}
          counts={counts}
          total={items.length}
        />
        <Button
          variant="subtle"
          color="gray"
          leftSection={getDismissAllIcon(dismiss)}
          onClick={markAllRead}
          disabled={filtered.length === 0}
          flex="none"
        >
          {getDismissAllLabel(dismiss)}
        </Button>
      </Flex>
      {shown.length === 0 ? (
        <FeedEmpty
          variant={empty}
          reason={selected.length > 0 ? EMPTY_REASON.FILTER : EMPTY_REASON.FEED}
          onReset={() => changeSelected([])}
        />
      ) : (
        <FeedRows
          items={shown}
          rows={rows}
          leading={leading}
          counter={counter}
          dismiss={dismiss}
          onRemove={remove}
        />
      )}
      <FeedPagination
        pagination={pagination}
        page={page}
        total={filtered.length}
        visibleCount={visibleCount}
        onPageChange={setPage}
        onLoadMore={loadMore}
      />
    </Stack>
  );
}

export default FeedPageMock;
