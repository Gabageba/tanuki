import { Radio, Stack } from '@mantine/core';
import type { SourceId } from '@tanuki/contracts';
import { DEMO_NETWORKS } from '../lib';
import type { VariantProps } from '../models';
import NetworkHeading from './NetworkHeading';
import SourceCard from './SourceCard';

/** C1b — карточки под подписью сети: аккаунт, состояние и кнопка входа названы один раз на сеть. */
function VariantCardsGrouped({ sourceId, onChange }: VariantProps) {
  return (
    <Radio.Group value={sourceId} onChange={(value) => onChange(value as SourceId)}>
      <Stack gap="md">
        {DEMO_NETWORKS.map((network) => (
          <Stack key={network.title} gap={6}>
            <NetworkHeading network={network} />
            {network.sources.map((source) => (
              <SourceCard key={source.id} source={source} isSelected={source.id === sourceId} />
            ))}
          </Stack>
        ))}
      </Stack>
    </Radio.Group>
  );
}

export default VariantCardsGrouped;
