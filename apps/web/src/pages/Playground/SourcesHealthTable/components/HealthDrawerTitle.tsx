import { Group, Stack, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { isSourceInTitle } from '../lib';
import type { DrawerLayout, MockSource } from '../models';

type Props = {
  source: MockSource;
  layout: DrawerLayout;
};

/** Заголовок карточки: «Источник» (D1–D4) или сам источник — иконка, название и домен (D5). */
function HealthDrawerTitle({ source, layout }: Props) {
  if (!isSourceInTitle(layout)) return <Text fw={500}>Источник</Text>;

  return (
    <Group gap="sm" wrap="nowrap" miw={0}>
      <SourceIcon id={source.id} title={source.title} size={32} />
      <Stack gap={0} miw={0}>
        <Text fw={600} truncate>
          {source.title}
        </Text>
        <Text fz="xs" c="dimmed" ff="monospace" truncate>
          {source.domain}
        </Text>
      </Stack>
    </Group>
  );
}

export default HealthDrawerTitle;
