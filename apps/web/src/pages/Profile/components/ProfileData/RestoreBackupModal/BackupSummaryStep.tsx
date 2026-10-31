import { Button, Stack } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import type { BackupPreview } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import BackupOwner from './BackupOwner';
import BackupSummaryRows from './BackupSummaryRows';
import { hasConflicts } from './lib';
import type { RestoreChoices } from './models';
import NothingNewNote from './NothingNewNote';
import RestoreQuestions from './RestoreQuestions';

type Props = {
  preview: BackupPreview;
  form: UseFormReturnType<RestoreChoices>;
  isRestoring: boolean;
  onNext: () => void;
  onRestore: (choices: RestoreChoices) => void;
  onCancel: () => void;
};

/** Шаг «Сводка»: чья копия и что в ней. С конфликтами — «Далее» к вопросам; без них вопросов нет,
 *  флажок настроек стоит здесь же и сразу «Восстановить». */
function BackupSummaryStep({ preview, form, isRestoring, onNext, onRestore, onCancel }: Props) {
  const { t } = useTranslation();
  const withQuestions = hasConflicts(preview);

  return (
    <form onSubmit={form.onSubmit(withQuestions ? onNext : onRestore)}>
      <Stack gap="md">
        <BackupOwner preview={preview} />
        <NothingNewNote preview={preview} />
        <BackupSummaryRows preview={preview} />
        {!withQuestions && <RestoreQuestions preview={preview} form={form} />}
        <ModalButtonsLayout>
          <Button variant="default" onClick={onCancel}>
            {t('cancel')}
          </Button>
          {withQuestions ? (
            <Button type="submit" leftSection={<ArrowRightIcon />}>
              {t('next')}
            </Button>
          ) : (
            <Button type="submit" leftSection={<UploadSimpleIcon />} loading={isRestoring}>
              {t('recover')}
            </Button>
          )}
        </ModalButtonsLayout>
      </Stack>
    </form>
  );
}

export default BackupSummaryStep;
