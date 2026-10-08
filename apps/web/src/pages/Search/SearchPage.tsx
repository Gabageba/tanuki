import { useState } from 'react';
import {
  Badge,
  Button,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { Link, useSearchParams } from 'react-router';
import { SignInIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { SOURCE_ACCOUNTS_PATH } from '@/shared/lib/routes';
import TitleCard from '@/entities/title/card/TitleCard';
import BlockLoader from '@/shared/ui/BlockLoader';
import useTitleBookmarkFolders from '@/entities/bookmark/hooks/useTitleBookmarkFolders';
import useSearch from './hooks/useSearch';
import { flattenSources } from '@/entities/source/lib';
import useSources from '@/entities/source/hooks/useSources';
import { SEARCH_GROUP_STATUS } from '@tanuki/contracts';
import { getGroupStatusColor, getGroupStatusLabel } from './models';

function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') ?? '';
  const [input, setInput] = useState(query);
  // Пустой запрос выключен и висит в pending — крутится только то, что действительно грузится.
  const { data, isLoading } = useSearch({ query });
  const { data: sourcesData } = useSources();
  const getBookmarkFolder = useTitleBookmarkFolders(
    data?.groups.flatMap(({ items }) => items.map(({ id }) => id)) ?? [],
  );

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

      {isLoading && <BlockLoader />}

      <Stack gap="xl">
        {data?.groups.map((group) => (
          <div key={group.sourceId}>
            <Group gap="xs" mb="sm">
              <Title order={3}>{sourceTitle(group.sourceId)}</Title>
              {group.status !== SEARCH_GROUP_STATUS.OK && (
                <Badge color={getGroupStatusColor(group.status)} variant="light">
                  {getGroupStatusLabel(group.status, t)}
                </Badge>
              )}
              {group.status === SEARCH_GROUP_STATUS.LOCKED && (
                <Button
                  component={Link}
                  to={SOURCE_ACCOUNTS_PATH}
                  variant="subtle"
                  size="compact-sm"
                  leftSection={<SignInIcon />}
                >
                  {t('logIn')}
                </Button>
              )}
            </Group>
            {group.items.length === 0 && group.status === SEARCH_GROUP_STATUS.OK && (
              <Text c="dimmed" size="sm">
                {t('nothingFound')}
              </Text>
            )}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md">
              {group.items.map((title) => (
                <TitleCard
                  key={title.id}
                  title={title}
                  bookmarkFolder={getBookmarkFolder(title.id)}
                />
              ))}
            </SimpleGrid>
          </div>
        ))}
      </Stack>
    </Container>
  );
}

export default SearchPage;
