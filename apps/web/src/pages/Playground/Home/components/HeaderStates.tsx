import { Box, Stack, Text } from '@mantine/core';
import {
  HEADER_HIGHLIGHT,
  MOCK_PAGE,
  type HeaderHighlight,
  type HeaderHome,
  type MockPage,
} from '../models';
import HeaderMock from './HeaderMock';

const PAGE_PATHS: { page: MockPage; path: string }[] = [
  { page: MOCK_PAGE.HOME, path: '/' },
  { page: MOCK_PAGE.CATALOG, path: '/catalog/remanga' },
  { page: MOCK_PAGE.BOOKMARKS, path: '/bookmarks' },
  { page: MOCK_PAGE.NOTIFICATIONS, path: '/notifications' },
];

type Props = {
  variant: HeaderHome;
  highlight?: HeaderHighlight;
  /** Подварианты H3 смотрят ещё и закладки с уведомлениями; остальные — главную и каталог. */
  withIconPages?: boolean;
};

/** Шапка варианта на нескольких страницах подряд — каждая в рамке, как верх окна приложения. */
function HeaderStates({
  variant,
  highlight = HEADER_HIGHLIGHT.LIGHT,
  withIconPages = false,
}: Props) {
  const pages = withIconPages ? PAGE_PATHS : PAGE_PATHS.slice(0, 2);

  return (
    <Stack gap="sm" maw={1100}>
      {pages.map(({ page, path }) => (
        <Stack key={page} gap={6}>
          <Text fz={12} c="dimmed" ff="monospace">
            {path}
          </Text>
          <Box
            bd="1px solid var(--mantine-color-default-border)"
            bdrs="md"
            style={{ overflow: 'hidden' }}
          >
            <HeaderMock variant={variant} page={page} highlight={highlight} />
            <Box h={24} bg="var(--mantine-color-body)" />
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

export default HeaderStates;
