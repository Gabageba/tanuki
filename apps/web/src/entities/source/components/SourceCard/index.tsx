import { Card, Group, Stack, Text } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import type { Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/consts/routes';
import SourceTitle from '@/entities/source/components/SourceTitle';
import SourceStatusBadge from '../SourceStatusBadge';
import { getFlagByLocale } from '../../lib';
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
      <Group gap="xs">
        <SourceTitle source={source} />
        <Stack gap={8} justify="end">
          <Group gap={4} justify="flex-end">
            <Text fz={20} lh={1}>
              {getFlagByLocale(source.locale)}
            </Text>
            <Text>{source.locale.toUpperCase()}</Text>
          </Group>

          <SourceStatusBadge source={source} />
        </Stack>
      </Group>
    </Card>
  );
}

export default SourceCard;
