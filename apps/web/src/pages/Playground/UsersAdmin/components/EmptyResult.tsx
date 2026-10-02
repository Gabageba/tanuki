import { Button, Stack, Text, ThemeIcon } from '@mantine/core';
import { FunnelXIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';

type Props = {
  onReset: () => void;
};

function EmptyResult({ onReset }: Props) {
  return (
    <Stack align="center" gap="xs" py="xl">
      <ThemeIcon variant="light" color="gray" size={48} radius="xl">
        <MagnifyingGlassIcon size={24} />
      </ThemeIcon>
      <Text fw={500}>Никого не нашли</Text>
      <Text fz="sm" c="dimmed" ta="center">
        Попробуйте другое имя или почту либо сбросьте фильтры.
      </Text>
      <Button variant="default" leftSection={<FunnelXIcon />} onClick={onReset}>
        Сбросить фильтры
      </Button>
    </Stack>
  );
}

export default EmptyResult;
