import { Button, Group, SimpleGrid, Stack } from '@mantine/core';
import { UserCircleIcon } from '@phosphor-icons/react';
import { DEMO_IMPORT_SOURCES, type VariantProps } from '../models';
import SourceAccountLine from './SourceAccountLine';
import SourceTile from './SourceTile';

/** C2a — одна сетка: под названием — сеть, у недоступных ещё и причина в цвете состояния. */
function VariantTilesFlat({ sourceId, onChange }: VariantProps) {
  const selected = DEMO_IMPORT_SOURCES.find(({ id }) => id === sourceId);

  return (
    <Stack gap="sm">
      <SimpleGrid cols={3} spacing="xs">
        {DEMO_IMPORT_SOURCES.map((source) => (
          <SourceTile
            key={source.id}
            source={source}
            isSelected={source.id === sourceId}
            onSelect={() => onChange(source.id)}
            isNetworkShown
            isStateShown
          />
        ))}
      </SimpleGrid>
      <Group justify="space-between" wrap="nowrap">
        {selected && <SourceAccountLine source={selected} />}
        <Button variant="subtle" size="xs" flex="none" leftSection={<UserCircleIcon />}>
          Аккаунты источников
        </Button>
      </Group>
    </Stack>
  );
}

export default VariantTilesFlat;
