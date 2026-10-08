import type { ReactNode } from 'react';
import { Group, Stack, Text, Title } from '@mantine/core';
import { MOCK_QUERY } from '../mocks';
import PageToolbar from './PageToolbar';

type Props = {
  filtersCount: number;
  /** Строка «Нашлось на N источниках» под заголовком; без неё — сводки текстом нет. */
  foundCount?: number;
  /** H6 — ряд под заголовком во всю ширину: чипы-якоря. */
  children?: ReactNode;
  /** Вид и «Фильтры» справа; в итоге они уходят в строку под шапкой, как в каталоге. */
  withToolbar?: boolean;
};

/** H2/H6 — «Результаты по «…»» заголовком, под ним сводка и/или чипы источников. */
function HeaderResultsFor({ filtersCount, foundCount, children, withToolbar = true }: Props) {
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
        <Stack gap={2} miw={0}>
          <Title order={2}>Результаты по «{MOCK_QUERY}»</Title>
          {foundCount !== undefined && (
            <Text c="dimmed" fz="sm">
              Нашлось на {foundCount} источниках
            </Text>
          )}
        </Stack>
        {withToolbar && <PageToolbar filtersCount={filtersCount} />}
      </Group>
      {children}
    </Stack>
  );
}

export default HeaderResultsFor;
