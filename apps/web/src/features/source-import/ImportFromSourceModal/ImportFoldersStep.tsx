import { Button, Stack } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon, CloudArrowDownIcon } from '@phosphor-icons/react';
import type { SourceImportPreview } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { getDefaultFolderIds, hasQuestions, summarizeSelection } from './lib';
import type { ImportChoices } from './models';
import NothingNewFromSourceNote from './NothingNewFromSourceNote';
import SourceBookmarksEmpty from './SourceBookmarksEmpty';
import SourceFoldersList from './SourceFoldersList';

type Props = {
  sourceTitle: string;
  preview: SourceImportPreview;
  form: UseFormReturnType<ImportChoices>;
  isImporting: boolean;
  onNext: () => void;
  onImport: (choices: ImportChoices) => void;
  onBack: () => void;
  onCancel: () => void;
};

/**
 * Шаг «Папки»: выбор целыми папками сайта, тайтлы не перечисляются. Есть среди выбранного
 * конфликты — «Далее» к вопросам, нет — сразу «Импорт».
 */
function ImportFoldersStep({
  sourceTitle,
  preview,
  form,
  isImporting,
  onNext,
  onImport,
  onBack,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const selectable = getDefaultFolderIds(preview);
  const summary = summarizeSelection(preview, form.getValues().folderIds);
  const isNext = hasQuestions(summary);

  if (preview.folders.length === 0) {
    return <SourceBookmarksEmpty sourceTitle={sourceTitle} onBack={onBack} />;
  }

  return (
    <form onSubmit={form.onSubmit((values) => (isNext ? onNext() : onImport(values)))}>
      <Stack gap="sm">
        <NothingNewFromSourceNote sourceTitle={sourceTitle} folders={preview.folders} />
        <SourceFoldersList sourceTitle={sourceTitle} preview={preview} form={form} />
        <ModalButtonsLayout>
          <Button variant="default" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            leftSection={isNext ? <ArrowRightIcon /> : <CloudArrowDownIcon />}
            loading={isImporting}
            disabled={selectable.length === 0}
          >
            {isNext ? t('next') : t('import')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </form>
  );
}

export default ImportFoldersStep;
