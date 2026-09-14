import { Link } from 'react-router';
import type { CardProps } from '@mantine/core';
import { Card } from '@mantine/core';
import type { Manga } from '@tanuki/contracts';

type Props = {
  manga: Manga;
} & Omit<CardProps, 'component' | 'to'>;

function NavigateToMangaCard({ manga, ...restProps }: Props) {
  return <Card component={Link} to={`/manga/${manga.id}`} {...restProps} />;
}

export default NavigateToMangaCard;
