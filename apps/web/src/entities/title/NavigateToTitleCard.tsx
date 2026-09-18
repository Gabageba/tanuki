import { Link } from 'react-router';
import type { CardProps } from '@mantine/core';
import { Card } from '@mantine/core';
import type { Title } from '@tanuki/contracts';

type Props = {
  title: Title;
} & Omit<CardProps, 'component' | 'to'>;

function NavigateToTitleCard({ title, ...restProps }: Props) {
  return <Card component={Link} to={`/title/${title.id}`} {...restProps} />;
}

export default NavigateToTitleCard;
