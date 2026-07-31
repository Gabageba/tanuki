import { Card, Container, Loader, SimpleGrid, Text, Title } from '@mantine/core';
import { Link } from 'react-router';
import { useSources } from '@/shared/api/sources';

export function Home() {
  const { data, isLoading, isError } = useSources();

  return (
    <Container py="xl">
      <Title order={1} mb="md">
        Tanuki
      </Title>

      {isLoading && <Loader />}
      {isError && <Text c="red">Не удалось загрузить список источников.</Text>}

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {data?.items.map((source) => (
          <Card
            key={source.id}
            component={Link}
            to={`/source/${source.id}`}
            withBorder
            padding="lg"
          >
            <Text fw={500}>{source.title}</Text>
            <Text size="sm" c="dimmed">
              {source.locale.toUpperCase()}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
