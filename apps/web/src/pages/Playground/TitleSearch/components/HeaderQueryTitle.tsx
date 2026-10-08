import { Group, Stack, Text, Title } from '@mantine/core';
import { MOCK_QUERY } from '../mocks';
import PageToolbar from './PageToolbar';

type Props = {
  filtersCount: number;
};

/** H5 — заголовок страницы — сам запрос; «Поиск» мелкой служебной подписью над ним. */
function HeaderQueryTitle({ filtersCount }: Props) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
      <Stack gap={2} miw={0}>
        <Text fz="xs" c="dimmed" ff="monospace" tt="uppercase" lts={1}>
          Поиск
        </Text>
        <Title order={2} lineClamp={2}>
          {MOCK_QUERY}
        </Title>
      </Stack>
      <PageToolbar filtersCount={filtersCount} />
    </Group>
  );
}

export default HeaderQueryTitle;
