import { Button, Stack } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { CloudArrowDownIcon } from '@phosphor-icons/react';
import type { SourceImportPreview } from '@tanuki/contracts';
import MergeQuestions from '@/features/library-merge/MergeQuestions';
import { MERGE_ORIGIN } from '@/features/library-merge/models';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { summarizeSelection } from './lib';
import type { ImportChoices } from './models';

type Props = {
  preview: SourceImportPreview;
  form: UseFormReturnType<ImportChoices>;
  isImporting: boolean;
  onImport: (choices: ImportChoices) => void;
  onCancel: () => void;
};

/** Шаг «Вопросы» — только при конфликтах в выбранных папках; числа — по ним же. */
function ImportQuestionsStep({ preview, form, isImporting, onImport, onCancel }: Props) {
  const { t } = useTranslation();
  const summary = summarizeSelection(preview, form.getValues().folderIds);

  return (
    <form onSubmit={form.onSubmit(onImport)}>
      <Stack gap="md">
        <MergeQuestions
          origin={MERGE_ORIGIN.SOURCE}
          otherFolder={summary.otherFolder}
          progressDiffers={summary.progressDiffers}
          form={form}
        />
        <ModalButtonsLayout>
          <Button variant="default" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button type="submit" leftSection={<CloudArrowDownIcon />} loading={isImporting}>
            {t('import')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </form>
  );
}

export default ImportQuestionsStep;
