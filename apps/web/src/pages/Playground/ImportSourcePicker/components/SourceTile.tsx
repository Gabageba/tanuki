import { Box, Stack, Text, UnstyledButton } from '@mantine/core';
import { CheckCircleIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { PRIMARY_COLOR, getMutedBackground } from '@/shared/lib/palette';
import { getAccountStateColor } from '../../SourcesSetup/lib';
import { getAccountStateIcon } from '../../SourcesSetup/components/lib';
import { getShortStateLabel, isImportAvailable } from '../lib';
import type { DemoImportSource } from '../models';

type Props = {
  source: DemoImportSource;
  isSelected: boolean;
  onSelect: () => void;
  isNetworkShown?: boolean;
  /** Подписать под плиткой, почему источник недоступен; без этого причину называет только иконка. */
  isStateShown?: boolean;
};

/** Плитка источника: в углу — галочка выбора или иконка состояния входа в его цвете. */
function SourceTile({
  source,
  isSelected,
  onSelect,
  isNetworkShown = false,
  isStateShown = false,
}: Props) {
  const isAvailable = isImportAvailable(source);
  const color = getAccountStateColor(source.state);

  return (
    <UnstyledButton
      pos="relative"
      p="xs"
      bg={isSelected ? getMutedBackground(PRIMARY_COLOR, true) : undefined}
      aria-pressed={isSelected}
      aria-disabled={!isAvailable}
      onClick={() => isAvailable && onSelect()}
      style={{
        border: `1px solid ${isSelected ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-default-border)'}`,
        borderRadius: 'var(--mantine-radius-md)',
        cursor: isAvailable ? 'pointer' : 'not-allowed',
      }}
    >
      <Stack gap={4} align="center">
        <SourceIcon id={source.id} title={source.title} size={40} opacity={isAvailable ? 1 : 0.5} />
        <Text
          fz={13}
          lh={1.2}
          mt={2}
          ta="center"
          truncate
          maw="100%"
          c={isAvailable ? undefined : 'dimmed'}
        >
          {source.title}
        </Text>
        {isNetworkShown && (
          <Text fz={11} lh={1.2} c="dimmed" ta="center" truncate maw="100%">
            {source.network}
          </Text>
        )}
        {isStateShown && !isAvailable && (
          <Text fz={11} lh={1.2} c={color} ta="center" truncate maw="100%">
            {getShortStateLabel(source.state)}
          </Text>
        )}
      </Stack>
      <Box pos="absolute" top={6} right={6} fz={16} lh={0} c={color}>
        {isSelected && (
          <CheckCircleIcon weight="fill" color="var(--mantine-primary-color-filled)" />
        )}
        {!isAvailable && getAccountStateIcon(source.state)}
      </Box>
    </UnstyledButton>
  );
}

export default SourceTile;
