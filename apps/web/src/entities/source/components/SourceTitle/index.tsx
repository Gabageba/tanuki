import { Badge, Box, Group, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import { type Source } from '@tanuki/contracts';
import SourceStatusBadge from '../SourceStatusBadge';
import SourceIcon from '../SourceIcon';
import SourceTitleSkeleton from './SourceTitleSkeleton';

type Props = {
  source: Source;
  showStatus?: boolean;
  isPending?: boolean;
  /** То, что идёт в строке названия после бейджей, — например, каретка меню. */
  rightSection?: ReactNode;
};

function SourceTitle({ source, showStatus = false, isPending = false, rightSection }: Props) {
  if (isPending) {
    return <SourceTitleSkeleton />;
  }

  return (
    <Group flex={1} miw={0} wrap="nowrap">
      <Box flex="none">
        <SourceIcon id={source.id} title={source.title} />
      </Box>
      <Box miw={0}>
        <Group gap={8} wrap="nowrap">
          <Title order={5} miw={0} lineClamp={1} style={{ wordBreak: 'break-all' }}>
            {source.title}
          </Title>
          {source.isAdult && (
            <Badge color="red" ff="monospace" flex="none">
              18+
            </Badge>
          )}
          {source.requiresVpn && (
            <Badge color="cyan" ff="monospace" flex="none">
              VPN
            </Badge>
          )}
          {showStatus && (
            <Box flex="none">
              <SourceStatusBadge source={source} />
            </Box>
          )}
          {rightSection}
        </Group>
        <Text size="sm" c="dimmed" ff="monospace" truncate>
          {source.domain}
        </Text>
      </Box>
    </Group>
  );
}

export default SourceTitle;
