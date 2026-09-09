import { ActionIcon, Tooltip } from '@mantine/core';
import { StethoscopeIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import useProbeSource from './hooks/useProbeSource';

type Props = {
  source: Source;
};

function SourceHealthRowActions({ source }: Props) {
  const { isPending, mutate } = useProbeSource({ sourceId: source.id, sourceTitle: source.title });

  return (
    <Tooltip label="Прогнать проверку сейчас">
      <ActionIcon variant="subtle" color="gray" loading={isPending} onClick={() => mutate()}>
        <StethoscopeIcon size={16} />
      </ActionIcon>
    </Tooltip>
  );
}

export default SourceHealthRowActions;
