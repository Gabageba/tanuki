import { SimpleGrid, Stack } from '@mantine/core';
import { DEMO_NETWORKS } from '../lib';
import type { VariantProps } from '../models';
import NetworkHeading from './NetworkHeading';
import SourceTile from './SourceTile';

/** C2b — плитки под подписью сети: состояние и кнопка входа — в подписи, плитка несёт только иконку. */
function VariantTilesGrouped({ sourceId, onChange }: VariantProps) {
  return (
    <Stack gap="md">
      {DEMO_NETWORKS.map((network) => (
        <Stack key={network.title} gap={6}>
          <NetworkHeading network={network} />
          <SimpleGrid cols={3} spacing="xs">
            {network.sources.map((source) => (
              <SourceTile
                key={source.id}
                source={source}
                isSelected={source.id === sourceId}
                onSelect={() => onChange(source.id)}
              />
            ))}
          </SimpleGrid>
        </Stack>
      ))}
    </Stack>
  );
}

export default VariantTilesGrouped;
