import { Badge, Card, Group, Text, Title } from '@mantine/core';
import { Link } from 'react-router';
import type { Source } from '@tanuki/contracts';
import SourceIcon from './SourceIcon';
import SourceStatusBadge from './SourceStatusBadge';
import styles from './SourceCard.module.scss';

type Props = {
  source: Source;
};
function SourceCard({ source }: Props) {
  return (
    <Card component={Link} to={`/source/${source.id}`} className={styles.card} withBorder>
      <Group>
        <Group flex={1}>
          <SourceIcon id={source.id} title={source.title} />
          <div>
            <Group gap="xs">
              <Title order={5}>{source.title}</Title>
              {source.isAdult && (
                <Badge color="red" variant="light">
                  18+
                </Badge>
              )}
            </Group>
            <Text size="sm" c="dimmed" ff="monospace" truncate>
              {source.domain}
            </Text>
          </div>
        </Group>
        <SourceStatusBadge status={source.status} />
      </Group>
    </Card>
  );
}

export default SourceCard;
