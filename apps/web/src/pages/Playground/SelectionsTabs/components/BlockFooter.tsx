import { Button, Center, Divider, Loader, Stack, Text } from '@mantine/core';
import { generatePath } from 'react-router';
import { ArrowClockwiseIcon, ArrowDownIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ArrowLink from '@/shared/ui/ArrowLink';
import {
  BLOCK_END,
  NEXT_PAGE_ERROR,
  type BlockEnd,
  type MockBlock,
  type MockFeed,
  type NextPageError,
} from '../models';

type Props = {
  source: Source;
  block: MockBlock;
  feed: MockFeed;
  end: BlockEnd;
  nextPageError: NextPageError;
  onRetry: () => void;
};

/** Строка, которую сайт показывает про конечный блок, — одна на все варианты E. */
const END_NOTE = 'Сайт показывает в этом блоке только эти тайтлы';

/**
 * Низ сетки блока: подгрузка следующей порции, её ошибка (ось F) или конец блока, у которого на
 * сайте нет продолжения (ось E). Конец листаемого блока ничем не отмечен — как в каталоге.
 */
function BlockFooter({ source, block, feed, end, nextPageError, onRetry }: Props) {
  if (feed.isFetchingNextPage) {
    return (
      <Center>
        <Loader mt="md" />
      </Center>
    );
  }

  if (feed.isNextPageFailed) {
    switch (nextPageError) {
      case NEXT_PAGE_ERROR.TOAST_ONLY:
        return null;
      case NEXT_PAGE_ERROR.RETRY_ROW:
        return (
          <Stack gap="xs" align="center" mt="md">
            <Text fz="sm" c="dimmed" ta="center">
              Следующие тайтлы не загрузились
            </Text>
            <Button variant="default" leftSection={<ArrowClockwiseIcon />} onClick={onRetry}>
              Повторить загрузку тайтлов
            </Button>
          </Stack>
        );
      case NEXT_PAGE_ERROR.RETRY_ROW_LIST:
        return (
          <Stack gap="xs" align="center" mt="md">
            <Text fz="sm" c="dimmed" ta="center">
              Не удалось загрузить продолжение списка
            </Text>
            <Button variant="default" leftSection={<ArrowClockwiseIcon />} onClick={onRetry}>
              Повторить загрузку списка
            </Button>
          </Stack>
        );
      case NEXT_PAGE_ERROR.LOAD_MORE:
        return (
          <Center mt="md">
            <Button variant="default" leftSection={<ArrowDownIcon />} onClick={onRetry}>
              Загрузить ещё тайтлы
            </Button>
          </Center>
        );
    }
  }

  if (feed.hasNextPage || block.pages > 1 || feed.items.length === 0) {
    return null;
  }

  switch (end) {
    case BLOCK_END.NOTE:
    case BLOCK_END.TAB_COUNT:
      return (
        <Text fz="sm" c="dimmed" ta="center" mt="md">
          {END_NOTE}
        </Text>
      );
    case BLOCK_END.NOTE_CATALOG:
      return (
        <Stack gap={6} align="center" mt="md">
          <Text fz="sm" c="dimmed" ta="center">
            {END_NOTE}
          </Text>
          <ArrowLink to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}>
            Каталог: {source.title}
          </ArrowLink>
        </Stack>
      );
    case BLOCK_END.DIVIDER:
      return <Divider mt="lg" label={END_NOTE} labelPosition="center" />;
  }
}

export default BlockFooter;
