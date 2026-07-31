import { Card, Image, Text } from '@mantine/core';
import type { Manga } from '@tanuki/contracts';
import { Link } from 'react-router';
import styles from './MangaCard.module.scss';

interface MangaCardProps {
  manga: Manga;
}

export default function MangaCard({ manga }: MangaCardProps) {
  return (
    <Card
      component={Link}
      to={`/manga/${manga.sourceId}/${manga.id.slice(manga.sourceId.length + 1)}`}
      className={styles.card}
      padding="xs"
      radius="md"
      withBorder
    >
      <Card.Section>
        <Image
          src={manga.largeCoverUrl || undefined}
          alt={manga.title}
          loading="lazy"
          decoding="async"
          className={styles.cover}
        />
      </Card.Section>
      <Text size="sm" fw={500} lineClamp={2} mt="xs">
        {manga.title}
      </Text>
    </Card>
  );
}
