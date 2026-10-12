import { Group, Paper, Stack, Text, ThemeIcon, Title, UnstyledButton } from '@mantine/core';
import { Link } from 'react-router';
import { ArrowRightIcon, CaretRightIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { formatSelectionsCount } from '../lib';
import { DISCOVER_PATH, MOCK_HOME_ALL, MOCK_SOURCES_TOTAL } from '../mocks';
import SourceEntryGrid from './SourceEntryGrid';

/** V4 — заголовок «Подборки ›» сам ведёт на страницу подборок, под ним — сколько их; внизу —
 *  плашка во всю ширину «Каталоги всех источников». */
function EntriesLinkHeadings() {
  const selectionsCount = MOCK_HOME_ALL.reduce((sum, { blocks }) => sum + blocks.length, 0);

  return (
    <Stack gap={48}>
      <Stack gap="md">
        <UnstyledButton component={Link} to={DISCOVER_PATH} w="fit-content">
          <Stack gap={2}>
            <Group gap={4} wrap="nowrap">
              <Title order={4}>Подборки</Title>
              <CaretRightIcon size={20} />
            </Group>
            <Text fz="sm" c="dimmed">
              {MOCK_HOME_ALL.length} источников · {formatSelectionsCount(selectionsCount)}
            </Text>
          </Stack>
        </UnstyledButton>
        <SourceEntryGrid />
      </Stack>
      <Paper
        component={Link}
        to={ROUTE_PATHS.SOURCES}
        withBorder
        radius="md"
        p="md"
        c="inherit"
        td="none"
      >
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group gap="sm" wrap="nowrap" miw={0}>
            <ThemeIcon variant="light" size={40} radius="md">
              <SquaresFourIcon size={22} />
            </ThemeIcon>
            <Stack gap={2} miw={0}>
              <Text fw={600}>Каталоги всех источников</Text>
              <Text fz="sm" c="dimmed">
                {MOCK_SOURCES_TOTAL} сайта — с фильтрами и поиском
              </Text>
            </Stack>
          </Group>
          <ArrowRightIcon />
        </Group>
      </Paper>
    </Stack>
  );
}

export default EntriesLinkHeadings;
