import { Button, Checkbox, Group, Text } from '@mantine/core';
import { FunnelXIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  opened: boolean;
  groupTitle: string | undefined;
  onConfirm: (rememberChoice: boolean) => void;
  onCancel: () => void;
};

function ExclusiveFilterConfirmModal({ opened, groupTitle, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  const [rememberChoice, setRememberChoice] = useState(false);

  return (
    <ToneModal
      tone={MODAL_TONE.WARNING}
      icon={FunnelXIcon}
      opened={opened}
      onClose={onCancel}
      title={t('resetOtherFilters')}
    >
      <Text fz="sm" mb="md">
        {groupTitle
          ? t('cannotCombineFiltersWithGroup', { groupTitle })
          : t('cannotCombineFilters')}
      </Text>
      <Checkbox
        label={t('dontAskAgain')}
        checked={rememberChoice}
        onChange={(event) => setRememberChoice(event.currentTarget.checked)}
        mb="md"
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button leftSection={<FunnelXIcon />} onClick={() => onConfirm(rememberChoice)}>
          {t('replace')}
        </Button>
      </Group>
    </ToneModal>
  );
}

export default ExclusiveFilterConfirmModal;
