import { Button, Group, NavLink, Paper, Stack, Text } from '@mantine/core';
import { CaretRightIcon, UserCircleIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { AVAILABLE_SOURCES, LOCKED_SOURCES } from '../lib';
import type { VariantProps } from '../models';
import SourceAccountLine from './SourceAccountLine';

/**
 * C5 — список-меню: клик по источнику сразу запускает чтение закладок, без отдельной кнопки.
 * Источники без входа не занимают строк — про них одна сноска со ссылкой на аккаунты.
 */
function VariantInstant({ sourceId, onChange }: VariantProps) {
  return (
    <Stack gap="sm">
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        {AVAILABLE_SOURCES.map((source) => (
          <NavLink
            key={source.id}
            component="button"
            type="button"
            px="md"
            label={source.title}
            description={<SourceAccountLine source={source} />}
            active={source.id === sourceId}
            leftSection={<SourceIcon id={source.id} title={source.title} size={32} />}
            rightSection={<CaretRightIcon />}
            onClick={() => onChange(source.id)}
          />
        ))}
      </Paper>
      <Group justify="space-between" wrap="nowrap">
        <Text fz={12} c="dimmed">
          Ещё {LOCKED_SOURCES.length} источника — после входа:{' '}
          {LOCKED_SOURCES.map(({ title }) => title).join(', ')}
        </Text>
        <Button variant="subtle" size="xs" flex="none" leftSection={<UserCircleIcon />}>
          Аккаунты источников
        </Button>
      </Group>
    </Stack>
  );
}

export default VariantInstant;
