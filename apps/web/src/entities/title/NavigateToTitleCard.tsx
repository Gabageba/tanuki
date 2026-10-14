import { generatePath, Link } from 'react-router';
import type { CardProps } from '@mantine/core';
import { Card } from '@mantine/core';
import { VIEW_MODE, type ViewMode } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import styles from './Title.module.scss';

type Props = {
  titleId: string;
  /** Плитка — прозрачная, при наведении окрашивается текст; строка списка — в рамке, при
   *  наведении подсвечивается фон. */
  viewMode: ViewMode;
} & Omit<CardProps, 'component' | 'to' | 'className' | 'withBorder'>;

function NavigateToTitleCard({ titleId, viewMode, ...restProps }: Props) {
  return (
    <Card
      component={Link}
      to={generatePath(ROUTE_PATHS.TITLE, { titleId })}
      data-view-mode={viewMode}
      className={styles.card}
      withBorder={viewMode === VIEW_MODE.LIST}
      {...restProps}
    />
  );
}

export default NavigateToTitleCard;
