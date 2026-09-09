import { Button } from '@mantine/core';
import { StethoscopeIcon } from '@phosphor-icons/react';
import useProbeAllSources from './hooks/useProbeAllSources';

function ProbeAllButton() {
  const { isPending, mutate } = useProbeAllSources();

  return (
    <Button
      variant="default"
      leftSection={<StethoscopeIcon size={16} />}
      loading={isPending}
      onClick={() => mutate()}
    >
      Проверить все
    </Button>
  );
}

export default ProbeAllButton;
