import { Button } from '@mantine/core';
import { StethoscopeIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import useProbeSource from './hooks/useProbeSource';

type Props = {
  source: Source;
};

function ProbeSourceButton({ source }: Props) {
  const { t } = useTranslation();
  const { isPending, mutate } = useProbeSource({ sourceId: source.id, sourceTitle: source.title });

  return (
    <Button
      variant="default"
      leftSection={<StethoscopeIcon size={16} />}
      loading={isPending}
      onClick={() => mutate()}
    >
      {t('checkNow')}
    </Button>
  );
}

export default ProbeSourceButton;
