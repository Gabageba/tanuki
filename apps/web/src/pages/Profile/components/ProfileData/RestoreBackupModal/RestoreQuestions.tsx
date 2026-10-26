import { Checkbox, Stack } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import type { BackupPreview } from '@tanuki/contracts';
import MergeQuestions from '@/features/library-merge/MergeQuestions';
import { MERGE_ORIGIN } from '@/features/library-merge/models';
import type { RestoreChoices } from './models';

type Props = {
  preview: BackupPreview;
  form: UseFormReturnType<RestoreChoices>;
};

/** Вопросы о конфликтах — только если есть о чём спрашивать. Флажок настроек — всегда. */
function RestoreQuestions({ preview, form }: Props) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <MergeQuestions
        origin={MERGE_ORIGIN.BACKUP}
        otherFolder={preview.bookmarks.otherFolder}
        progressDiffers={preview.progress.differs}
        form={form}
      />
      <Checkbox
        label={t('applySettingsFromBackup')}
        description={t('replacesGeneralReaderSourceOrder')}
        {...form.getInputProps('applySettings', { type: 'checkbox' })}
      />
    </Stack>
  );
}

export default RestoreQuestions;
