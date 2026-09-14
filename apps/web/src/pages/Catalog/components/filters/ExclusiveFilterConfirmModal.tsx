import { Button, Checkbox, Group, Modal, Text } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
    <Modal opened={opened} onClose={onCancel} title={t('resetOtherFilters')} centered>
      <Text size="sm" mb="md">
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
        <Button onClick={() => onConfirm(rememberChoice)}>{t('replace')}</Button>
      </Group>
    </Modal>
  );
}

export default ExclusiveFilterConfirmModal;
