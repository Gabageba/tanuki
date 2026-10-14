import { Avatar, Button, Stack, Title } from '@mantine/core';
import { Link } from 'react-router';
import { SparkleIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { DISCOVER_PATH, MOCK_HOME_ALL, MOCK_SOURCES_TOTAL } from '../mocks';
import AllSourcesLink from './AllSourcesLink';
import SourceEntryGrid from './SourceEntryGrid';

/** V1 — два блока со своими заголовками: «Подборки источников» с кнопкой «Все подборки» во всю
 *  ширину под карточками и в самом низу «Источники» — ряд логотипов и «Все источники · 23». */
function EntriesBlocks() {
  return (
    <Stack gap={48}>
      <Stack gap="md">
        <Title order={4}>Подборки источников</Title>
        <SourceEntryGrid />
        <Button
          component={Link}
          to={DISCOVER_PATH}
          variant="default"
          fullWidth
          leftSection={<SparkleIcon />}
        >
          Все подборки
        </Button>
      </Stack>
      <Stack gap="md">
        <Title order={4}>Источники</Title>
        <Avatar.Group spacing="sm">
          {MOCK_HOME_ALL.map(({ source }) => (
            <SourceIcon key={source.id} id={source.id} title={source.title} size={36} />
          ))}
          <Avatar size={36} ff="monospace">
            +{MOCK_SOURCES_TOTAL - MOCK_HOME_ALL.length}
          </Avatar>
        </Avatar.Group>
        <AllSourcesLink asButton fullWidth count={MOCK_SOURCES_TOTAL} />
      </Stack>
    </Stack>
  );
}

export default EntriesBlocks;
