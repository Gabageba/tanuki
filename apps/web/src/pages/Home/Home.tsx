import { useState } from 'react';
import { Container, Divider, Loader, SimpleGrid, Text, TextInput, Title } from '@mantine/core';
import { useNavigate } from 'react-router';
import { SourceCard } from '@/entities/source';
import { useSources } from '@/shared/api/sources';

// Источники, обкатанные раньше остальных (были в ENABLED_SOURCES до массового
// добавления всех источников парсера) — на UI они идут первыми, до Divider'а,
// чтобы отличать проверенное от только что подключённого.
const STABILIZED_SOURCE_IDS = new Set([
  'READMANGA_RU',
  'MINTMANGA',
  'SELFMANGA',
  'REMANGA',
  'DESUME',
  'MANGALIB',
  'USAGI',
  'SEIMANGA',
  'MANGABUFF',
  'YAOILIB',
  'TOMILOLIB',
  'WAMANGA',
]);

export default function Home() {
  const { data, isLoading, isError } = useSources();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const stabilized = data?.items.filter((source) => STABILIZED_SOURCE_IDS.has(source.id)) ?? [];
  const newSources = data?.items.filter((source) => !STABILIZED_SOURCE_IDS.has(source.id)) ?? [];

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
      {isError && <Text c="red">Не удалось загрузить список источников.</Text>}

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {stabilized.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </SimpleGrid>

      {newSources.length > 0 && (
        <>
          <Divider my="xl" label="Новые источники" labelPosition="center" />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {newSources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </SimpleGrid>
        </>
      )}
    </Container>
  );
}
