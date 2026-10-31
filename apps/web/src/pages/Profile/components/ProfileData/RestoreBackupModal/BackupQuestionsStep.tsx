import { Button, Stack } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { UploadSimpleIcon } from '@phosphor-icons/react';
import type { BackupPreview } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import type { RestoreChoices } from './models';
import RestoreQuestions from './RestoreQuestions';

type Props = {
  preview: BackupPreview;
  form: UseFormReturnType<RestoreChoices>;
  isRestoring: boolean;
  onRestore: (choices: RestoreChoices) => void;
  onCancel: () => void;
};

/** Шаг «Вопросы» — только при конфликтах. «Восстановить» сразу пишет, без предупреждения:
 *  заменяет лишь то, что выбрано здесь. */
function BackupQuestionsStep({ preview, form, isRestoring, onRestore, onCancel }: Props) {
  const { t } = useTranslation();

  return (
    <form onSubmit={form.onSubmit(onRestore)}>
      <Stack gap="md">
        <RestoreQuestions preview={preview} form={form} />
        <ModalButtonsLayout>
          <Button variant="default" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button type="submit" leftSection={<UploadSimpleIcon />} loading={isRestoring}>
            {t('recover')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </form>
  );
}

export default BackupQuestionsStep;
