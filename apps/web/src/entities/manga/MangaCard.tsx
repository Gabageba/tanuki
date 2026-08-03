import { Badge, Card, Image, Text } from '@mantine/core';
import type { Manga } from '@tanuki/contracts';
import { Link } from 'react-router';
import styles from './MangaCard.module.scss';

interface MangaCardProps {
  manga: Manga;
  showSource?: boolean;
}

export default function MangaCard({ manga, showSource = false }: MangaCardProps) {
  return (
    <Card
      component={Link}
      to={`/manga/${manga.sourceId}/${manga.id.slice(manga.sourceId.length + 1)}`}
      className={styles.card}
      padding="xs"
      radius="md"
      withBorder
    >
      <Card.Section pos="relative">
        <Image
          src={manga.largeCoverUrl || manga.coverUrl}
          alt={manga.title}
          loading="lazy"
          decoding="async"
          className={styles.cover}
        />
        {showSource && (
          <Badge className={styles.sourceBadge} size="sm" variant="filled">
            {manga.sourceId}
          </Badge>
        )}
      </Card.Section>
      <Text size="sm" fw={500} lineClamp={2} mt="xs">
        {manga.title}
      </Text>
    </Card>
  );
}
