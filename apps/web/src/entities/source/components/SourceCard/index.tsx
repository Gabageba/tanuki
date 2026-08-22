import { Card, Group } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import type { Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/consts/routes';
import SourceTitle from '@/entities/source/components/SourceTitle';
import SourceStatusBadge from '../SourceStatusBadge';
import styles from './SourceCard.module.scss';

type Props = {
  source: Source;
};
function SourceCard({ source }: Props) {
  return (
    <Card
      component={Link}
      to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}
      className={styles.card}
      withBorder
    >
      <Group>
        <SourceTitle source={source} />
        <SourceStatusBadge status={source.status} />
      </Group>
    </Card>
  );
}

export default SourceCard;
