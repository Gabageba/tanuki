import { Button } from '@mantine/core';
import { StethoscopeIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import useProbeAllSources from './hooks/useProbeAllSources';

function ProbeAllButton() {
  const { t } = useTranslation();
  const { isPending, mutate } = useProbeAllSources();

  return (
    <Button
      variant="default"
      leftSection={<StethoscopeIcon size={16} />}
      loading={isPending}
      onClick={() => mutate()}
    >
      {t('checkAll')}
    </Button>
  );
}

export default ProbeAllButton;
