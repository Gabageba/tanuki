import { Button, Checkbox, Divider, ScrollArea, Stack } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon, CloudArrowDownIcon } from '@phosphor-icons/react';
import type { SourceImportPreview } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { getDefaultFolderIds, hasQuestions, summarizeSelection } from './lib';
import { FOLDERS_LIST_MAX_HEIGHT, type ImportChoices } from './models';
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
  const isAll = selectable.length > 0 && summary.folderCount === selectable.length;
  const isNext = hasQuestions(summary);

  if (preview.folders.length === 0) {
    return <SourceBookmarksEmpty sourceTitle={sourceTitle} onBack={onBack} />;
  }

  return (
    <form onSubmit={form.onSubmit((values) => (isNext ? onNext() : onImport(values)))}>
      <Stack gap="sm">
        <NothingNewFromSourceNote sourceTitle={sourceTitle} folders={preview.folders} />
        <Checkbox
          label={t('selectedCountFoldersCountTitles', {
            folders: summary.folderCount,
            count: summary.titleCount,
          })}
          checked={isAll}
          indeterminate={summary.folderCount > 0 && !isAll}
          disabled={selectable.length === 0}
          error={form.errors.folderIds}
          onChange={() => form.setFieldValue('folderIds', isAll ? [] : selectable)}
        />
        <Divider />
        <ScrollArea.Autosize
          mah={FOLDERS_LIST_MAX_HEIGHT}
          type="auto"
          scrollbars="y"
          offsetScrollbars
          display="block"
          miw={0}
        >
          <SourceFoldersList sourceTitle={sourceTitle} folders={preview.folders} form={form} />
        </ScrollArea.Autosize>
        <ModalButtonsLayout>
          <Button variant="default" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            leftSection={isNext ? <ArrowRightIcon /> : <CloudArrowDownIcon />}
            loading={isImporting}
          >
            {isNext ? t('next') : t('import')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </form>
  );
}

export default ImportFoldersStep;
