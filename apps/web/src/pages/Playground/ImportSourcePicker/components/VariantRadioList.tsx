import { Button, Group, Radio, Stack, Text } from '@mantine/core';
import { SignInIcon } from '@phosphor-icons/react';
import type { SourceId } from '@tanuki/contracts';
import { isImportAvailable } from '../lib';
import { DEMO_IMPORT_SOURCES, type VariantProps } from '../models';
import SourceAccountLine from './SourceAccountLine';

/** C0 — нынешний список радио-кнопок, только строка теперь источник, а не сеть. */
function VariantRadioList({ sourceId, onChange }: VariantProps) {
  return (
    <Radio.Group value={sourceId} onChange={(value) => onChange(value as SourceId)}>
      <Stack gap="sm">
        {DEMO_IMPORT_SOURCES.map((source) => (
          <Group key={source.id} justify="space-between" wrap="nowrap">
            <Radio
              value={source.id}
              disabled={!isImportAvailable(source)}
              label={
                <Stack gap={2}>
                  <Text fz="sm">{source.title}</Text>
                  <SourceAccountLine source={source} />
                </Stack>
              }
            />
            {!isImportAvailable(source) && (
              <Button variant="subtle" size="xs" leftSection={<SignInIcon />}>
                Войти
              </Button>
            )}
          </Group>
        ))}
      </Stack>
    </Radio.Group>
  );
}

export default VariantRadioList;
