import { useState } from 'react';
import {
  Badge,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useSearchParams } from 'react-router';
import MangaCard from '@/entities/manga/card/MangaCard';
import useSearch from './hooks/useSearch';
import { flattenSources } from '@/entities/source/lib';
import useSources from '@/entities/source/hooks/useSources';
import ApiErrorText from '@/shared/ui/ApiErrorText';
import { SEARCH_GROUP_STATUS } from '@tanuki/contracts';
import { GROUP_STATUS_LABEL } from './models';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') ?? '';
  const [input, setInput] = useState(query);
  const { data, error, isLoading, isError } = useSearch({ query });
  const { data: sourcesData } = useSources();

  const sourceTitle = (sourceId: string) =>
    flattenSources(sourcesData).find((source) => source.id === sourceId)?.title ?? sourceId;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (input.trim()) {
      void setSearchParams({ query: input.trim() });
    }
  };

  return (
    <Container py="xl">
      <Title order={1} mb="md">
        Поиск
      </Title>

      <form onSubmit={handleSubmit}>
        <TextInput
          placeholder="Искать по всем источникам…"
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          mb="lg"
        />
      </form>

      {isLoading && <Loader />}
      {isError && <ApiErrorText error={error} />}

      <Stack gap="xl">
        {data?.groups.map((group) => (
          <div key={group.sourceId}>
            <Group gap="xs" mb="sm">
              <Title order={3}>{sourceTitle(group.sourceId)}</Title>
              {group.status !== SEARCH_GROUP_STATUS.OK && (
                <Badge
                  color={group.status === SEARCH_GROUP_STATUS.TIMEOUT ? 'yellow' : 'red'}
                  variant="light"
                >
                  {GROUP_STATUS_LABEL[group.status]}
                </Badge>
              )}
            </Group>
            {group.items.length === 0 && group.status === SEARCH_GROUP_STATUS.OK && (
              <Text c="dimmed" size="sm">
                Ничего не найдено
              </Text>
            )}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md">
              {group.items.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </SimpleGrid>
          </div>
        ))}
      </Stack>
    </Container>
  );
}

export default SearchPage;
