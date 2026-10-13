import { useState } from 'react';
import { Button, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { CaretDownIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import ResponsiveDrawer from '@/shared/ui/ResponsiveDrawer';

type Props = {
  sources: Source[];
  activeId: string;
  onChange: (sourceId: string) => void;
  isPhone: boolean;
};

/** S3 — кнопка с выбранным источником открывает drawer: плитки источников с крупным логотипом
 *  (на телефоне снизу, на десктопе сбоку). */
function SourceDrawerPicker({ sources, activeId, onChange, isPhone }: Props) {
  const [opened, setOpened] = useState(false);
  const active = sources.find(({ id }) => id === activeId);
  if (!active) return null;

  const handlePick = (sourceId: string) => {
    onChange(sourceId);
    setOpened(false);
  };

  return (
    <>
      <Button
        variant="default"
        leftSection={<SourceIcon id={active.id} title={active.title} size={20} radius="sm" />}
        rightSection={<CaretDownIcon />}
        fullWidth={isPhone}
        justify={isPhone ? 'space-between' : undefined}
        onClick={() => setOpened(true)}
      >
        {active.title}
      </Button>
      <ResponsiveDrawer
        title="Источник подборок"
        side="right"
        opened={opened}
        onClose={() => setOpened(false)}
      >
        <SimpleGrid cols={2} spacing="xs">
          {sources.map((source) => {
            const isActive = source.id === activeId;
            return (
              <UnstyledButton
                key={source.id}
                p="sm"
                bdrs="md"
                bd={`1px solid ${
                  isActive
                    ? 'var(--mantine-primary-color-filled)'
                    : 'var(--mantine-color-default-border)'
                }`}
                bg={isActive ? 'var(--mantine-primary-color-light)' : undefined}
                onClick={() => handlePick(source.id)}
              >
                <Stack gap={6} align="center">
                  <SourceIcon id={source.id} title={source.title} />
                  <Text fz="sm" fw={600} ta="center" lineClamp={1}>
                    {source.title}
                  </Text>
                  <Text fz="xs" c="dimmed" ff="monospace" truncate maw="100%">
                    {source.domain}
                  </Text>
                </Stack>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>
      </ResponsiveDrawer>
    </>
  );
}

export default SourceDrawerPicker;
