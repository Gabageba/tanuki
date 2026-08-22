import { useState } from 'react';
import {
  Anchor,
  Badge,
  Container,
  Grid,
  Group,
  Image,
  List,
  Loader,
  SegmentedControl,
  Text,
  Title,
} from '@mantine/core';
import { Link, useParams } from 'react-router';
import useChapters from './hooks/useChapters';
import useMangaDetails from './hooks/useMangaDetails';
import ApiErrorText from '@/shared/ui/ApiErrorText';

function MangaPage() {
  const { sourceId = '', mangaId = '' } = useParams<{ sourceId: string; mangaId: string }>();
  const { data, error, isLoading, isError } = useMangaDetails({ sourceId, mangaId });
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const branches = data?.branches ?? [];
  const branchId = selectedBranchId ?? branches[0]?.id ?? null;
  const selectedBranch = branches.find((branch) => branch.id === branchId);
  const { data: chaptersData, isLoading: chaptersLoading } = useChapters({
    sourceId,
    mangaId,
    branch: selectedBranch?.name ?? undefined,
  });
  const chapters = chaptersData?.items.slice().reverse() ?? [];

  if (isLoading) {
    return (
      <Container py="xl">
        <Loader />
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container py="xl">
        <ApiErrorText error={error} />
      </Container>
    );
  }

  const { manga } = data;

  return (
    <Container py="xl">
      <Grid>
        <Grid.Col span={{ base: 12, sm: 4, md: 3 }}>
          <Image src={manga.largeCoverUrl || manga.coverUrl} alt={manga.title} radius="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 8, md: 9 }}>
          <Title order={1}>{manga.title}</Title>
          {manga.authors.length > 0 && <Text c="dimmed">{manga.authors.join(', ')}</Text>}
          <Group gap="xs" my="sm">
            {manga.tags.map((tag) => (
              <Badge key={tag.id} variant="light">
                {tag.title}
              </Badge>
            ))}
          </Group>
          {manga.description && <Text>{manga.description}</Text>}
          <Anchor
            href={manga.publicUrl}
            target="_blank"
            rel="noreferrer nofollow"
            mt="sm"
            display="inline-block"
          >
            Читать на источнике
          </Anchor>
        </Grid.Col>
      </Grid>

      {branches.length > 1 && (
        <SegmentedControl
          mt="lg"
          value={branchId ?? undefined}
          onChange={setSelectedBranchId}
          data={branches.map((branch) => ({ value: branch.id, label: branch.name ?? 'Основная' }))}
        />
      )}

      <Title order={2} mt="lg" mb="sm">
        Главы
      </Title>
      {chaptersLoading && <Loader />}
      <List spacing="xs" listStyleType="none">
        {chapters.map((chapter) => (
          <List.Item key={chapter.id}>
            <Anchor
              component={Link}
              to={`/manga/${sourceId}/${mangaId}/read/${chapter.id.slice(sourceId.length + 1)}`}
            >
              {chapter.title || `Глава ${chapter.number ?? '?'}`}
            </Anchor>
          </List.Item>
        ))}
      </List>
    </Container>
  );
}

export default MangaPage;
