import { Badge, Box, Group, Text, Title } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import SourceStatusBadge from '../SourceStatusBadge';
import SourceIcon from '../SourceIcon';
import SourceTitleSkeleton from './SourceTitleSkeleton';

type Props = {
  source: Source;
  showStatus?: boolean;
  isLoading?: boolean;
};

function SourceTitle({ source, showStatus = false, isLoading = false }: Props) {
  if (isLoading) {
    return <SourceTitleSkeleton />;
  }

  return (
    <Group flex={1}>
      <SourceIcon id={source.id} title={source.title} />
      <Box>
        <Group gap={8}>
          <Title order={5}>{source.title}</Title>
          {source.isAdult && <Badge color="red">18+</Badge>}
          {source.requiresVpn && <Badge color="cyan">VPN</Badge>}
          {showStatus && <SourceStatusBadge sourceId={source.id} status={source.status} />}
        </Group>
        <Text size="sm" c="dimmed" ff="monospace" truncate>
          {source.domain}
        </Text>
      </Box>
    </Group>
  );
}

export default SourceTitle;
