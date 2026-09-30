import {
  Box,
  Button,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { CheckCircleIcon, LockKeyIcon, UserCircleIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { PRIMARY_COLOR, getMutedBackground } from '@/shared/lib/palette';
import { getAccountStateLabel } from '../../SourcesSetup/lib';
import { isImportAvailable } from '../lib';
import { DEMO_IMPORT_SOURCES, type VariantProps } from '../models';
import SourceAccountLine from './SourceAccountLine';

/** C2 — плитка логотипов: источник узнают по иконке, аккаунт выбранного назван под сеткой. */
function VariantTiles({ sourceId, onChange }: VariantProps) {
  const selected = DEMO_IMPORT_SOURCES.find(({ id }) => id === sourceId);

  return (
    <Stack gap="sm">
      <SimpleGrid cols={3} spacing="xs">
        {DEMO_IMPORT_SOURCES.map((source) => {
          const isAvailable = isImportAvailable(source);
          const isSelected = source.id === sourceId;

          return (
            <Tooltip
              key={source.id}
              label={getAccountStateLabel(source.state)}
              disabled={isAvailable}
            >
              <UnstyledButton
                pos="relative"
                p="sm"
                bg={isSelected ? getMutedBackground(PRIMARY_COLOR, true) : undefined}
                aria-pressed={isSelected}
                aria-disabled={!isAvailable}
                onClick={() => isAvailable && onChange(source.id)}
                style={{
                  border: `1px solid ${isSelected ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-default-border)'}`,
                  borderRadius: 'var(--mantine-radius-md)',
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                }}
              >
                <Stack gap={6} align="center" opacity={isAvailable ? 1 : 0.45}>
                  <SourceIcon id={source.id} title={source.title} size={40} />
                  <Text fz={13} lh={1.2} ta="center" truncate maw="100%">
                    {source.title}
                  </Text>
                </Stack>
                <Box pos="absolute" top={6} right={6} fz={16} lh={0} c="dimmed">
                  {isSelected && (
                    <CheckCircleIcon weight="fill" color="var(--mantine-primary-color-filled)" />
                  )}
                  {!isAvailable && <LockKeyIcon />}
                </Box>
              </UnstyledButton>
            </Tooltip>
          );
        })}
      </SimpleGrid>
      <Group justify="space-between" wrap="nowrap">
        {selected && <SourceAccountLine source={selected} />}
        <Button variant="subtle" size="xs" leftSection={<UserCircleIcon />}>
          Аккаунты источников
        </Button>
      </Group>
    </Stack>
  );
}

export default VariantTiles;
