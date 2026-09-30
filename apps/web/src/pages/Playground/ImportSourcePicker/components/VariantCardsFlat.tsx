import { Group, Radio, Stack, Text } from '@mantine/core';
import type { SourceId } from '@tanuki/contracts';
import MidDot from '@/shared/ui/MidDot';
import { isImportAvailable } from '../lib';
import { DEMO_IMPORT_SOURCES, type VariantProps } from '../models';
import AccountStateMark from './AccountStateMark';
import LoginActionButton from './LoginActionButton';
import SourceCard from './SourceCard';

/** C1a — плоский список карточек: сеть названа в каждой, рядом — логин или состояние входа. */
function VariantCardsFlat({ sourceId, onChange }: VariantProps) {
  return (
    <Radio.Group value={sourceId} onChange={(value) => onChange(value as SourceId)}>
      <Stack gap="xs">
        {DEMO_IMPORT_SOURCES.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            isSelected={source.id === sourceId}
            description={
              <Group gap={6} wrap="nowrap" c="dimmed" fz={12} lh={1.2}>
                <Text inherit flex="none">
                  {source.network}
                </Text>
                <MidDot />
                {isImportAvailable(source) ? (
                  <Text inherit ff="monospace" truncate>
                    {source.login}
                  </Text>
                ) : (
                  <AccountStateMark state={source.state} />
                )}
              </Group>
            }
            action={<LoginActionButton state={source.state} />}
          />
        ))}
      </Stack>
    </Radio.Group>
  );
}

export default VariantCardsFlat;
