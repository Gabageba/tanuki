import { Badge, Box, Group, Text, Title } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import SourceStatusBadge from '../SourceStatusBadge';
import SourceIcon from '../SourceIcon';
import SourceTitleSkeleton from './SourceTitleSkeleton';

type Props = {
  source: Source;
  showStatus?: boolean;
  isPending?: boolean;
};

function SourceTitle({ source, showStatus = false, isPending = false }: Props) {
  if (isPending) {
    return <SourceTitleSkeleton />;
  }

  return (
    <Group flex={1}>
      <SourceIcon id={source.id} title={source.title} />
      <Box>
        <Group gap={8}>
          <Title order={5}>{source.title}</Title>
          {source.isAdult && (
            <Badge color="red" ff="monospace">
              18+
            </Badge>
          )}
          {source.requiresVpn && (
            <Badge color="cyan" ff="monospace">
              VPN
            </Badge>
          )}
          {showStatus && <SourceStatusBadge source={source} />}
        </Group>
        <Text size="sm" c="dimmed" ff="monospace" truncate>
          {source.domain}
        </Text>
      </Box>
    </Group>
  );
}

export default SourceTitle;
