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
import { useTranslation } from 'react-i18next';
import TitleCard from '@/entities/title/card/TitleCard';
import useSearch from './hooks/useSearch';
import { flattenSources } from '@/entities/source/lib';
import useSources from '@/entities/source/hooks/useSources';
import ApiErrorText from '@/shared/ui/ApiErrorText';
import { SEARCH_GROUP_STATUS } from '@tanuki/contracts';
import { getGroupStatusLabel } from './models';

function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') ?? '';
  const [input, setInput] = useState(query);
  const { data, error, isPending, isError } = useSearch({ query });
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
        {t('search')}
      </Title>

      <form onSubmit={handleSubmit}>
        <TextInput
          placeholder={t('searchAllSources')}
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          mb="lg"
        />
      </form>

      {isPending && <Loader />}
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
                  {getGroupStatusLabel(group.status, t)}
                </Badge>
              )}
            </Group>
            {group.items.length === 0 && group.status === SEARCH_GROUP_STATUS.OK && (
              <Text c="dimmed" size="sm">
                {t('nothingFound')}
              </Text>
            )}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md">
              {group.items.map((title) => (
                <TitleCard key={title.id} title={title} />
              ))}
            </SimpleGrid>
          </div>
        ))}
      </Stack>
    </Container>
  );
}

export default SearchPage;
