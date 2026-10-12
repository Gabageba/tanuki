import { Center, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { Link } from 'react-router';
import { ArrowRightIcon, SparkleIcon } from '@phosphor-icons/react';
import { DISCOVER_PATH } from '../mocks';
import SourceEntryGrid from './SourceEntryGrid';

/** V3 — «Все подборки» последней плиткой в сетке карточек, того же размера; «Все источники» —
 *  у заголовка страницы, ярче обычного (см. HomePageTitle). */
function EntriesTrailingTile() {
  return (
    <Stack gap="md">
      <Title order={4}>Подборки источников</Title>
      <SourceEntryGrid
        trailing={
          <Paper
            component={Link}
            to={DISCOVER_PATH}
            radius="md"
            p="sm"
            c="inherit"
            td="none"
            bg="var(--mantine-primary-color-light)"
            mih={140}
          >
            <Center h="100%">
              <Stack gap="xs" align="center">
                <ThemeIcon variant="filled" size={40} radius="xl">
                  <SparkleIcon size={22} />
                </ThemeIcon>
                <Group gap={4} wrap="nowrap">
                  <Text fw={600} c="var(--mantine-primary-color-light-color)">
                    Все подборки
                  </Text>
                  <ArrowRightIcon color="var(--mantine-primary-color-light-color)" />
                </Group>
              </Stack>
            </Center>
          </Paper>
        }
      />
    </Stack>
  );
}

export default EntriesTrailingTile;
