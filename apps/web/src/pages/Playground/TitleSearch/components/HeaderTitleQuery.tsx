import type { ReactNode } from 'react';
import { Group, Stack, Text, Title } from '@mantine/core';
import { MOCK_QUERY } from '../mocks';
import PageToolbar from './PageToolbar';

type Props = {
  filtersCount: number;
  /** H4 — ряд под заголовком. */
  children?: ReactNode;
};

/** H1 — «Поиск», под ним запрос приглушённой строкой; справа вид и «Фильтры». */
function HeaderTitleQuery({ filtersCount, children }: Props) {
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
        <Stack gap={2} miw={0}>
          <Title order={2}>Поиск</Title>
          <Text c="dimmed" fz="sm" lineClamp={2}>
            по запросу «{MOCK_QUERY}»
          </Text>
        </Stack>
        <PageToolbar filtersCount={filtersCount} />
      </Group>
      {children}
    </Stack>
  );
}

export default HeaderTitleQuery;
