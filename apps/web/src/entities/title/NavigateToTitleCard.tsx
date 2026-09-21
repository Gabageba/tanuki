import { generatePath, Link } from 'react-router';
import type { CardProps } from '@mantine/core';
import { Card } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Props = {
  title: Title;
} & Omit<CardProps, 'component' | 'to'>;

function NavigateToTitleCard({ title, ...restProps }: Props) {
  return (
    <Card
      component={Link}
      to={generatePath(ROUTE_PATHS.TITLE, { titleId: title.id })}
      {...restProps}
    />
  );
}

export default NavigateToTitleCard;
