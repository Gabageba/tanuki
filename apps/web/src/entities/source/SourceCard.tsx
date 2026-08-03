import { Card, Group, Text } from '@mantine/core';
import { Link } from 'react-router';
import type { Source } from '@tanuki/contracts';
import SourceStatusBadge from './SourceStatusBadge';

interface SourceCardProps {
  source: Source;
}

export default function SourceCard({ source }: SourceCardProps) {
  return (
    <Card component={Link} to={`/source/${source.id}`} withBorder padding="lg">
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text fw={500}>{source.title}</Text>
          <Text size="sm" c="dimmed">
            {source.locale.toUpperCase()}
          </Text>
        </div>
        <SourceStatusBadge status={source.status} />
      </Group>
    </Card>
  );
}
