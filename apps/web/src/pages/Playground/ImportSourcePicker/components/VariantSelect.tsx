import { Button, Group, Select, Stack, Text } from '@mantine/core';
import { CheckIcon, GlobeIcon, UserCircleIcon } from '@phosphor-icons/react';
import type { SourceId } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getAccountStateLabel } from '../../SourcesSetup/lib';
import { DEMO_NETWORKS, isImportAvailable } from '../lib';
import { DEMO_IMPORT_SOURCES, type VariantProps } from '../models';
import SourceAccountLine from './SourceAccountLine';

const OPTIONS = DEMO_NETWORKS.map((network) => ({
  group: network.title,
  items: network.sources.map((source) => ({
    value: source.id,
    label: source.title,
    disabled: !isImportAvailable(source),
  })),
}));

/** C4 — одно поле с выпадающим списком по сетям: шаг остаётся коротким, сколько бы источников ни было. */
function VariantSelect({ sourceId, onChange }: VariantProps) {
  const selected = DEMO_IMPORT_SOURCES.find(({ id }) => id === sourceId);

  return (
    <Stack gap="xs">
      <Select
        label="Источник"
        placeholder="Выберите источник"
        data={OPTIONS}
        value={sourceId}
        onChange={(value) => value && onChange(value as SourceId)}
        allowDeselect={false}
        searchable
        leftSection={
          selected ? (
            <SourceIcon id={selected.id} title={selected.title} size={20} />
          ) : (
            <GlobeIcon />
          )
        }
        renderOption={({ option, checked }) => {
          const source = DEMO_IMPORT_SOURCES.find(({ id }) => id === option.value);
          if (!source) return option.label;

          return (
            <Group gap="xs" wrap="nowrap" w="100%">
              <SourceIcon id={source.id} title={source.title} size={20} />
              <Text fz="sm" flex={1}>
                {source.title}
              </Text>
              {!isImportAvailable(source) && (
                <Text fz={12}>{getAccountStateLabel(source.state)}</Text>
              )}
              {checked && <CheckIcon color="var(--mantine-primary-color-filled)" />}
            </Group>
          );
        }}
      />
      <Group justify="space-between" wrap="nowrap">
        {selected && <SourceAccountLine source={selected} />}
        <Button variant="subtle" size="xs" leftSection={<UserCircleIcon />}>
          Аккаунты источников
        </Button>
      </Group>
    </Stack>
  );
}

export default VariantSelect;
