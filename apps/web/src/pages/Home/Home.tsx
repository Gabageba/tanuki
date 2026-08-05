import { useState } from 'react';
import { Container, Loader, SimpleGrid, TextInput, Title } from '@mantine/core';
import { useNavigate } from 'react-router';
import { SourceCard } from '@/entities/source';
import { useSources } from '@/shared/api/sources';
import { ApiErrorText } from '@/shared/ui';

export default function Home() {
  const { data, error, isLoading, isError } = useSources();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      void navigate(`/search?query=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <Container py="xl">
      <Title order={1} mb="md">
        Tanuki
      </Title>

      <form onSubmit={handleSearch}>
        <TextInput
          placeholder="Искать по всем источникам…"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          mb="lg"
        />
      </form>

      {isLoading && <Loader />}
      {isError && <ApiErrorText error={error} fallback="Не удалось загрузить список источников." />}

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {data?.items.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
