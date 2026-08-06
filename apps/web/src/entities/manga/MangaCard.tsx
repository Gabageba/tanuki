import { Badge, Card, Image, Text } from '@mantine/core';
import { Link } from 'react-router';
import type { Manga } from '@tanuki/contracts';
import styles from './MangaCard.module.scss';

type Props = {
  manga: Manga;
  showSource?: boolean;
};

function MangaCard({ manga, showSource = false }: Props) {
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
          src={manga.coverUrl}
          alt={manga.title}
          loading="lazy"
          decoding="async"
          className={styles.cover}
        />
        {showSource && (
          <Badge className={styles.sourceBadge} size="sm" variant="filled" ff="monospace">
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

export default MangaCard;
